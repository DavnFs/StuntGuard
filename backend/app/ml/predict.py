import json
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import numpy as np
import pandas as pd

from app.schemas import ModelInfoResponse, PredictionRequest, PredictionResponse


ARTIFACT_DIR = Path(__file__).resolve().parent / "model_artifacts"
MODEL_PATH = ARTIFACT_DIR / "stunting_model.joblib"
SCALER_PATH = ARTIFACT_DIR / "scaler.joblib"
METRICS_PATH = ARTIFACT_DIR / "metrics.json"
LABELS_PATH = ARTIFACT_DIR / "labels.json"

DISCLAIMER = (
    "Hasil ini merupakan skrining awal dan bukan diagnosis medis. "
    "Silakan konsultasikan ke petugas kesehatan atau Puskesmas untuk pemeriksaan lanjutan."
)

FEATURES = ["age_month", "gender", "height_cm", "weight_kg"]
HEIGHT_ONLY_FEATURES = ["age_month", "gender", "height_cm"]
ENGINEERED_FEATURES = [
    "age_month",
    "height_cm",
    "weight_kg",
    "height_gap_expected",
    "height_expected_ratio",
    "weight_gap_expected",
    "weight_expected_ratio",
]
DEFAULT_LABELS = ["severely stunted", "stunted", "normal", "tall"]
NUMERIC_LABELS = {
    0: "severely stunted",
    1: "stunted",
    2: "normal",
    3: "tall",
}
TEXT_LABELS = {
    "severely stunted": "severely stunted",
    "severely_stunted": "severely stunted",
    "stunted": "stunted",
    "normal": "normal",
    "tall": "tall",
}


def risk_level_for_status(status: str) -> str:
    mapping = {
        "severely stunted": "high",
        "stunted": "medium",
        "normal": "low",
        "tall": "monitor",
    }
    return mapping.get(status, "monitor")


def compute_growth_notes(payload: PredictionRequest) -> Dict[str, float]:
    gender_adjustment = 0.8 if payload.gender == "male" else 0.0
    if payload.age_month <= 24:
        expected_height = 50.0 + (payload.age_month * 1.55) + gender_adjustment
        expected_weight = 3.2 + (payload.age_month * 0.32)
    else:
        expected_height = 87.0 + ((payload.age_month - 24) * 0.62) + gender_adjustment
        expected_weight = 10.8 + ((payload.age_month - 24) * 0.18)

    return {
        "height_gap_expected": round(float(payload.height_cm - expected_height), 3),
        "height_expected_ratio": round(float(payload.height_cm / max(expected_height, 1)), 4),
        "weight_gap_expected": round(float(payload.weight_kg - expected_weight), 3),
        "weight_expected_ratio": round(float(payload.weight_kg / max(expected_weight, 1)), 4),
    }


def recommendation_for_status(status: str, growth_notes: Optional[Dict[str, float]] = None) -> str:
    recommendations = {
        "severely stunted": (
            "Risiko tinggi. Jadwalkan tindak lanjut segera dengan kader, bidan, atau Puskesmas. "
            "Lakukan pemantauan pertumbuhan bulanan dan edukasi gizi keluarga sesuai arahan tenaga kesehatan. "
            "Informasi ini bukan diagnosis medis."
        ),
        "stunted": (
            "Risiko sedang. Lanjutkan monitoring rutin, dorong edukasi makanan bergizi seimbang dan kaya protein, "
            "serta konsultasikan ke petugas kesehatan bila pertumbuhan tidak membaik."
        ),
        "normal": (
            "Status terpantau normal. Pertahankan asupan gizi seimbang, imunisasi dan kebersihan, "
            "serta lanjutkan pemantauan bulanan di Posyandu."
        ),
        "tall": (
            "Tinggi badan berada di kategori tall. Tetap lakukan pemantauan berkala dan konsultasikan "
            "ke petugas kesehatan bila pola pertumbuhan tampak tidak biasa."
        ),
    }
    recommendation = recommendations.get(status, "Lanjutkan pemantauan rutin dan konsultasikan hasil ke tenaga kesehatan.")
    if growth_notes:
        if growth_notes["weight_gap_expected"] <= -1.5:
            recommendation += (
                " Berat badan juga terlihat lebih rendah dari estimasi pertumbuhan umum. "
                "Pemantauan lanjutan disarankan."
            )
        elif growth_notes["height_gap_expected"] <= -4 and growth_notes["weight_gap_expected"] > -1.5:
            recommendation += (
                " Tinggi badan terlihat lebih rendah dibanding estimasi umum, meskipun berat badan tidak terlalu rendah. "
                "Perlu pemantauan tinggi badan berkala."
            )
    return recommendation


def _load_json(path: Path) -> Optional[Dict[str, Any]]:
    if not path.exists():
        return None
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def _load_labels() -> list[str]:
    if LABELS_PATH.exists():
        with LABELS_PATH.open("r", encoding="utf-8") as file:
            labels = json.load(file)
        if isinstance(labels, list) and labels:
            return labels
    return DEFAULT_LABELS


def _is_pipeline_model(model: Any) -> bool:
    return hasattr(model, "named_steps")


def _normalize_status(raw_status: Any) -> str:
    if isinstance(raw_status, (int, np.integer)):
        if int(raw_status) in NUMERIC_LABELS:
            return NUMERIC_LABELS[int(raw_status)]

    if isinstance(raw_status, (float, np.floating)) and float(raw_status).is_integer():
        if int(raw_status) in NUMERIC_LABELS:
            return NUMERIC_LABELS[int(raw_status)]

    key = str(raw_status).strip().lower()
    if key in TEXT_LABELS:
        return TEXT_LABELS[key]
    if key.isdigit() and int(key) in NUMERIC_LABELS:
        return NUMERIC_LABELS[int(key)]

    raise ValueError(f"Unsupported nutrition status label from model: {raw_status!r}")


def _numeric_features(payload: PredictionRequest) -> np.ndarray:
    # Matches modelstunting.ipynb: Laki-laki=0, Perempuan=1.
    gender_code = 0 if payload.gender == "male" else 1
    return np.array(
        [[payload.age_month, gender_code, payload.height_cm, payload.weight_kg]],
        dtype=float,
    )


def _model_mode_from_metrics(metrics: Optional[Dict[str, Any]], model: Any | None = None) -> str:
    if metrics and metrics.get("model_mode") in {"full-growth-model", "height-only-fallback-model"}:
        return str(metrics["model_mode"])
    if model is not None and not _is_pipeline_model(model) and SCALER_PATH.exists():
        return "full-growth-model"
    if MODEL_PATH.exists():
        return "full-growth-model"
    return "rule-based-fallback"


def _predict_with_artifact(
    model: Any,
    payload: PredictionRequest,
    record: Dict[str, Any],
    model_mode: str,
) -> tuple[str, Optional[float]]:
    if not _is_pipeline_model(model) and SCALER_PATH.exists():
        scaler = joblib.load(SCALER_PATH)
        features = scaler.transform(_numeric_features(payload))
        raw_status = model.predict(features)[0]
        confidence = None
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(features)[0]
            confidence = round(float(max(probabilities)), 4)
        return _normalize_status(raw_status), confidence

    columns = HEIGHT_ONLY_FEATURES if model_mode == "height-only-fallback-model" else FEATURES
    frame = pd.DataFrame([record], columns=columns)
    raw_status = model.predict(frame)[0]
    confidence = None
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(frame)[0]
        confidence = round(float(max(probabilities)), 4)
    return _normalize_status(raw_status), confidence


def _fallback_status(age_month: int, gender: str, height_cm: float, weight_kg: float) -> str:
    """Demo-only approximation used when no trained artifact is available."""
    gender_adjustment = 0.8 if gender == "male" else 0.0
    if age_month <= 24:
        expected_height = 50.0 + (age_month * 1.55) + gender_adjustment
        expected_weight = 3.2 + (age_month * 0.32)
    else:
        expected_height = 87.0 + ((age_month - 24) * 0.62) + gender_adjustment
        expected_weight = 10.8 + ((age_month - 24) * 0.18)

    height_diff = height_cm - expected_height
    weight_diff = weight_kg - expected_weight
    if height_diff <= -10 or (height_diff <= -8 and weight_diff <= -2.5):
        return "severely stunted"
    if height_diff <= -6 or (height_diff <= -4.5 and weight_diff <= -2):
        return "stunted"
    if height_diff >= 10:
        return "tall"
    return "normal"


def predict_nutrition(payload: PredictionRequest) -> PredictionResponse:
    growth_notes = compute_growth_notes(payload)
    record = {
        "age_month": payload.age_month,
        "gender": payload.gender,
        "height_cm": payload.height_cm,
        "weight_kg": payload.weight_kg,
    }

    if MODEL_PATH.exists():
        try:
            model = joblib.load(MODEL_PATH)
            metrics = _load_json(METRICS_PATH)
            model_mode = _model_mode_from_metrics(metrics, model)
            status, confidence = _predict_with_artifact(model, payload, record, model_mode)
            return PredictionResponse(
                nutrition_status=status,
                risk_level=risk_level_for_status(status),
                confidence=confidence,
                recommendation=recommendation_for_status(status, growth_notes),
                growth_notes=growth_notes,
                model_mode=model_mode,
                disclaimer=DISCLAIMER,
            )
        except Exception as exc:
            status = _fallback_status(
                payload.age_month,
                payload.gender,
                payload.height_cm,
                payload.weight_kg,
            )
            return PredictionResponse(
                nutrition_status=status,
                risk_level=risk_level_for_status(status),
                confidence=None,
                recommendation=(
                    recommendation_for_status(status, growth_notes)
                    + f" Catatan sistem: model scikit-learn belum dapat digunakan ({exc}); hasil memakai fallback demo."
                ),
                growth_notes=growth_notes,
                model_mode="rule-based-fallback",
                disclaimer=DISCLAIMER,
            )

    status = _fallback_status(payload.age_month, payload.gender, payload.height_cm, payload.weight_kg)
    return PredictionResponse(
        nutrition_status=status,
        risk_level=risk_level_for_status(status),
        confidence=None,
        recommendation=(
            recommendation_for_status(status, growth_notes)
            + " Catatan sistem: belum ada artefak model terlatih, sehingga hasil memakai fallback demo."
        ),
        growth_notes=growth_notes,
        model_mode="rule-based-fallback",
        disclaimer=DISCLAIMER,
    )


def get_model_info() -> ModelInfoResponse:
    metrics = _load_json(METRICS_PATH)
    labels = _load_labels()
    artifact_status = {
        "model": str(MODEL_PATH) if MODEL_PATH.exists() else None,
        "scaler": str(SCALER_PATH) if SCALER_PATH.exists() else None,
        "ready_for_inference": MODEL_PATH.exists(),
        "format": "joblib",
    }
    model_name = "Fallback demo rule"
    feature_importance = None
    uses_external_estimator = False
    active_model_mode = _model_mode_from_metrics(metrics)

    if MODEL_PATH.exists():
        try:
            model = joblib.load(MODEL_PATH)
            model_name = model.__class__.__name__
            artifact_status["model_container"] = (
                "pipeline" if _is_pipeline_model(model) else "estimator"
            )
            artifact_status["uses_separate_scaler"] = (
                not _is_pipeline_model(model) and SCALER_PATH.exists()
            )
            uses_external_estimator = bool(artifact_status["uses_separate_scaler"])
            active_model_mode = _model_mode_from_metrics(metrics, model)
        except Exception as exc:
            artifact_status["load_warning"] = str(exc)

    if metrics and not uses_external_estimator:
        model_name = metrics.get("best_model", metrics.get("model_name", model_name))
        feature_importance = metrics.get("feature_importance")
        metrics = {**metrics, "artifact_status": artifact_status}
    elif metrics and uses_external_estimator:
        metrics = {
            "artifact_status": artifact_status,
            "metrics_note": (
                "Model aktif memakai artefak notebook eksternal dengan scaler terpisah. "
                "Metrics lokal lama tidak ditampilkan agar tidak tertukar dengan model aktif."
            ),
        }
    else:
        metrics = {"artifact_status": artifact_status}

    trained_features = HEIGHT_ONLY_FEATURES if active_model_mode == "height-only-fallback-model" else FEATURES
    training_dataset_info = {}
    if metrics:
        for key in ("dataset_file", "row_count", "train_size", "test_size", "class_counts"):
            if key in metrics:
                training_dataset_info[key] = metrics[key]
        if not training_dataset_info and "metrics_note" in metrics:
            training_dataset_info["note"] = metrics["metrics_note"]

    limitations = [
        "StuntGuard adalah alat skrining awal, bukan diagnosis medis.",
        "Model hanya memakai umur, jenis kelamin, tinggi badan, dan berat badan bila tersedia.",
        "Kualitas prediksi bergantung pada dataset lokal dan cara pengukuran antropometri.",
    ]
    if active_model_mode == "height-only-fallback-model":
        limitations.append(
            "Model aktif adalah height-only fallback karena dataset training tidak memiliki weight_kg."
        )
    if active_model_mode == "rule-based-fallback":
        limitations.append("Artefak model belum tersedia atau gagal dimuat, sehingga sistem memakai fallback aturan demo.")

    return ModelInfoResponse(
        active_model_mode=active_model_mode,
        model_name=model_name,
        metrics=metrics,
        trained_features=trained_features,
        engineered_features=ENGINEERED_FEATURES if active_model_mode == "full-growth-model" else [],
        features=FEATURES,
        labels=labels,
        feature_importance=feature_importance,
        training_dataset_info=training_dataset_info,
        weight_available_during_training=active_model_mode == "full-growth-model",
        limitations=limitations,
        disclaimer=DISCLAIMER,
    )
