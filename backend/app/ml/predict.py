import json
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import pandas as pd

from app.schemas import ModelInfoResponse, PredictionRequest, PredictionResponse


ARTIFACT_DIR = Path(__file__).resolve().parent / "model_artifacts"
MODEL_PATH = ARTIFACT_DIR / "stunting_model.joblib"
METRICS_PATH = ARTIFACT_DIR / "metrics.json"
LABELS_PATH = ARTIFACT_DIR / "labels.json"

DISCLAIMER = (
    "Hasil ini hanya untuk skrining awal dan pendukung keputusan. "
    "Diagnosis dan intervensi resmi harus dikonsultasikan dengan tenaga kesehatan atau Puskesmas."
)

FEATURES = ["age_month", "gender", "height_cm"]
DEFAULT_LABELS = ["severely stunted", "stunted", "normal", "tall"]


def risk_level_for_status(status: str) -> str:
    mapping = {
        "severely stunted": "high",
        "stunted": "medium",
        "normal": "low",
        "tall": "monitor",
    }
    return mapping.get(status, "monitor")


def recommendation_for_status(status: str) -> str:
    recommendations = {
        "severely stunted": (
            "Risiko tinggi. Jadwalkan tindak lanjut segera dengan kader, bidan, atau Puskesmas. "
            "Lakukan pemantauan pertumbuhan berkala dan edukasi gizi keluarga sesuai arahan tenaga kesehatan."
        ),
        "stunted": (
            "Risiko sedang. Jadwalkan kontrol ulang, perbaiki pola makan bergizi seimbang, "
            "dan pantau tinggi badan setiap bulan bersama petugas Posyandu/Puskesmas."
        ),
        "normal": (
            "Status terpantau normal. Pertahankan asupan gizi seimbang, imunisasi dan kebersihan, "
            "serta lanjutkan pemantauan rutin di Posyandu."
        ),
        "tall": (
            "Tinggi badan berada di kategori tall. Tetap lakukan pemantauan berkala dan konsultasikan "
            "ke petugas kesehatan bila pola pertumbuhan tampak tidak biasa."
        ),
    }
    return recommendations.get(status, "Lanjutkan pemantauan rutin dan konsultasikan hasil ke tenaga kesehatan.")


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


def _fallback_status(age_month: int, gender: str, height_cm: float) -> str:
    """Demo-only approximation used when no trained artifact is available."""
    gender_adjustment = 0.8 if gender == "male" else 0.0
    if age_month <= 24:
        expected = 50.0 + (age_month * 1.55) + gender_adjustment
    else:
        expected = 87.0 + ((age_month - 24) * 0.62) + gender_adjustment

    diff = height_cm - expected
    if diff <= -10:
        return "severely stunted"
    if diff <= -6:
        return "stunted"
    if diff >= 10:
        return "tall"
    return "normal"


def predict_nutrition(payload: PredictionRequest) -> PredictionResponse:
    record = {
        "age_month": payload.age_month,
        "gender": payload.gender,
        "height_cm": payload.height_cm,
    }

    if MODEL_PATH.exists():
        try:
            model = joblib.load(MODEL_PATH)
            frame = pd.DataFrame([record], columns=FEATURES)
            status = str(model.predict(frame)[0])
            confidence = None
            if hasattr(model, "predict_proba"):
                probabilities = model.predict_proba(frame)[0]
                confidence = round(float(max(probabilities)), 4)
            return PredictionResponse(
                nutrition_status=status,
                risk_level=risk_level_for_status(status),
                confidence=confidence,
                recommendation=recommendation_for_status(status),
                disclaimer=DISCLAIMER,
            )
        except Exception as exc:
            status = _fallback_status(payload.age_month, payload.gender, payload.height_cm)
            return PredictionResponse(
                nutrition_status=status,
                risk_level=risk_level_for_status(status),
                confidence=None,
                recommendation=(
                    recommendation_for_status(status)
                    + f" Catatan sistem: model terlatih belum dapat digunakan ({exc}); hasil memakai fallback demo."
                ),
                disclaimer=DISCLAIMER,
            )

    status = _fallback_status(payload.age_month, payload.gender, payload.height_cm)
    return PredictionResponse(
        nutrition_status=status,
        risk_level=risk_level_for_status(status),
        confidence=None,
        recommendation=(
            recommendation_for_status(status)
            + " Catatan sistem: belum ada artefak model terlatih, sehingga hasil memakai fallback demo."
        ),
        disclaimer=DISCLAIMER,
    )


def get_model_info() -> ModelInfoResponse:
    metrics = _load_json(METRICS_PATH)
    labels = _load_labels()
    model_name = "Fallback demo rule"
    feature_importance = None

    if metrics:
        model_name = metrics.get("best_model", model_name)
        feature_importance = metrics.get("feature_importance")

    return ModelInfoResponse(
        model_name=model_name,
        metrics=metrics,
        features=FEATURES,
        labels=labels,
        feature_importance=feature_importance,
        disclaimer=DISCLAIMER,
    )
