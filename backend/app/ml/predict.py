import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import numpy as np
import pandas as pd

from app.schemas import ModelInfoResponse, PredictionRequest, PredictionResponse


logger = logging.getLogger(__name__)

ARTIFACT_DIR = Path(__file__).resolve().parent / "model_artifacts"
MODEL_PATH = ARTIFACT_DIR / "stunting_model.joblib"
SCALER_PATH = ARTIFACT_DIR / "scaler.joblib"
METRICS_PATH = ARTIFACT_DIR / "metrics.json"
LABELS_PATH = ARTIFACT_DIR / "labels.json"
NORMAL_VALUES_PATH = ARTIFACT_DIR / "normal_values.csv"

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

NORMAL_COLUMN_ALIASES = {
    "age": "age_month",
    "age (month)": "age_month",
    "age_month": "age_month",
    "umur": "age_month",
    "umur (bulan)": "age_month",
    "gender": "gender",
    "jenis kelamin": "gender",
    "height": "height_cm",
    "height (cm)": "height_cm",
    "height_cm": "height_cm",
    "tinggi badan (cm)": "height_cm",
    "weight": "weight_kg",
    "weight (kg)": "weight_kg",
    "weight_kg": "weight_kg",
    "berat badan (kg)": "weight_kg",
}


def risk_level_for_status(status: str) -> str:
    mapping = {
        "severely stunted": "high",
        "stunted": "medium",
        "normal": "low",
        "tall": "monitor",
    }
    return mapping.get(status, "monitor")


def summary_for_status(status: str) -> Dict[str, str]:
    summaries = {
        "severely stunted": {
            "title": "Segera Konsultasikan ke Petugas Kesehatan",
            "description": (
                "Hasil skrining menunjukkan risiko tinggi. Ini bukan diagnosis medis, "
                "tetapi perlu pemeriksaan lanjutan."
            ),
            "next_action": "Segera konsultasikan ke Posyandu atau Puskesmas.",
        },
        "stunted": {
            "title": "Anak Perlu Pemantauan Lebih Lanjut",
            "description": "Tinggi badan anak terlihat lebih rendah dibandingkan rata-rata anak seusianya.",
            "next_action": "Lakukan pemantauan rutin dan konsultasikan ke petugas kesehatan.",
        },
        "normal": {
            "title": "Pertumbuhan Anak Terlihat Normal",
            "description": (
                "Berdasarkan data yang dimasukkan, pertumbuhan anak masih berada pada kategori aman."
            ),
            "next_action": "Pertahankan gizi seimbang dan lanjutkan pemantauan bulanan.",
        },
        "tall": {
            "title": "Pertumbuhan Anak Di Atas Rata-Rata",
            "description": "Tinggi badan anak terlihat lebih tinggi dibandingkan rata-rata anak seusianya.",
            "next_action": "Tetap pantau pertumbuhan agar tetap proporsional.",
        },
    }
    return summaries.get(status, summaries["normal"])


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


def _gender_code(gender: Any) -> Optional[int]:
    if isinstance(gender, str):
        value = gender.strip().lower()
        if value in {"male", "laki-laki", "laki laki", "m", "0"}:
            return 0
        if value in {"female", "perempuan", "f", "1"}:
            return 1
    try:
        number = int(float(gender))
    except (TypeError, ValueError):
        return None
    return number if number in {0, 1} else None


def _normalize_normal_values(raw: pd.DataFrame) -> pd.DataFrame:
    rename_map = {}
    for column in raw.columns:
        key = str(column).strip().lower()
        if key in NORMAL_COLUMN_ALIASES:
            rename_map[column] = NORMAL_COLUMN_ALIASES[key]

    data = raw.rename(columns=rename_map)
    required = {"age_month", "gender", "height_cm", "weight_kg"}
    if not required.issubset(set(data.columns)):
        return pd.DataFrame(columns=["age_month", "gender_code", "height_cm", "weight_kg"])

    normalized = data[["age_month", "gender", "height_cm", "weight_kg"]].copy()
    normalized["age_month"] = pd.to_numeric(normalized["age_month"], errors="coerce")
    normalized["gender_code"] = normalized["gender"].map(_gender_code)
    normalized["height_cm"] = pd.to_numeric(normalized["height_cm"], errors="coerce")
    normalized["weight_kg"] = pd.to_numeric(normalized["weight_kg"], errors="coerce")
    normalized = normalized.dropna(subset=["age_month", "gender_code", "height_cm", "weight_kg"])
    normalized["age_month"] = normalized["age_month"].astype(float)
    normalized["gender_code"] = normalized["gender_code"].astype(int)
    normalized["height_cm"] = normalized["height_cm"].astype(float)
    normalized["weight_kg"] = normalized["weight_kg"].astype(float)
    return normalized[["age_month", "gender_code", "height_cm", "weight_kg"]]


@lru_cache(maxsize=1)
def _load_normal_values() -> Optional[pd.DataFrame]:
    if not NORMAL_VALUES_PATH.exists():
        return None
    try:
        data = _normalize_normal_values(pd.read_csv(NORMAL_VALUES_PATH))
    except Exception:
        return None
    return data if not data.empty else None


def get_normal_values(age: int, gender: str, normal_values_df: Optional[pd.DataFrame]) -> tuple[Optional[float], Optional[float]]:
    if normal_values_df is None or normal_values_df.empty:
        return None, None

    gender_code = _gender_code(gender)
    if gender_code is None:
        return None, None

    same_gender = normal_values_df[normal_values_df["gender_code"] == gender_code].copy()
    if same_gender.empty:
        return None, None

    same_gender["age_distance"] = (same_gender["age_month"] - float(age)).abs()
    row = same_gender.sort_values(["age_distance", "age_month"]).iloc[0]
    return round(float(row["height_cm"]), 2), round(float(row["weight_kg"]), 2)


def _percentage(value: float, normal_value: Optional[float]) -> Optional[float]:
    if normal_value is None or normal_value <= 0:
        return None
    return round(float((value / normal_value) * 100), 2)


def _height_explanation(percent: Optional[float]) -> str:
    if percent is None:
        return "Data rata-rata tinggi badan belum tersedia untuk pembanding."
    if percent < 90:
        return "Tinggi badan anak lebih rendah dibandingkan rata-rata anak seusianya."
    if percent < 97:
        return "Tinggi badan anak sedikit lebih rendah dibandingkan rata-rata anak seusianya."
    if percent <= 105:
        return "Tinggi badan anak masih mendekati rata-rata anak seusianya."
    return "Tinggi badan anak terlihat lebih tinggi dibandingkan rata-rata anak seusianya."


def _weight_explanation(percent: Optional[float]) -> str:
    if percent is None:
        return "Data rata-rata berat badan belum tersedia untuk pembanding."
    if percent < 85:
        return "Berat badan anak juga terlihat lebih rendah dibandingkan rata-rata anak seusianya."
    if percent < 95:
        return "Berat badan anak sedikit lebih rendah dibandingkan rata-rata."
    if percent <= 110:
        return "Berat badan anak masih mendekati rata-rata."
    return "Berat badan anak terlihat lebih tinggi dibandingkan rata-rata."


def build_growth_comparison(
    age: int,
    gender: str,
    height: float,
    weight: float,
    tb_normal: Optional[float],
    bb_normal: Optional[float],
) -> Dict[str, Any]:
    persentase_tb = _percentage(height, tb_normal)
    persentase_bb = _percentage(weight, bb_normal)
    tb_explanation = _height_explanation(persentase_tb)
    bb_explanation = _weight_explanation(persentase_bb)

    if tb_normal is None or bb_normal is None:
        overall = (
            "Data rata-rata pembanding belum tersedia. Hasil skrining tetap dapat digunakan sebagai "
            "informasi awal, tetapi pemantauan langsung di Posyandu/Puskesmas tetap disarankan."
        )
    elif persentase_tb is not None and persentase_tb < 90:
        overall = "Pemantauan tinggi badan secara berkala disarankan dan hasil sebaiknya dikonsultasikan."
    elif persentase_bb is not None and persentase_bb < 85:
        overall = "Pemantauan berat dan asupan gizi perlu diperhatikan bersama petugas kesehatan."
    else:
        overall = "Pertumbuhan tetap perlu dipantau secara rutin setiap bulan."

    warning = None
    if persentase_tb is not None and persentase_bb is not None and abs(persentase_tb - persentase_bb) >= 25:
        warning = (
            "Perbandingan tinggi dan berat tampak kurang proporsional. "
            "Ulangi pengukuran dan konsultasikan ke petugas kesehatan bila ragu."
        )

    return {
        "tb_normal": tb_normal,
        "bb_normal": bb_normal,
        "persentase_tb": persentase_tb,
        "persentase_bb": persentase_bb,
        "tb_explanation": tb_explanation,
        "bb_explanation": bb_explanation,
        "overall_explanation": overall,
        "warning": warning,
    }


def _add_status_warning(status: str, comparison: Dict[str, Any]) -> Dict[str, Any]:
    percent_height = comparison.get("persentase_tb")
    if status in {"stunted", "severely stunted"} and isinstance(percent_height, (int, float)) and percent_height >= 97:
        comparison = {**comparison}
        comparison["warning"] = (
            "Hasil model dan pembanding rata-rata terlihat berbeda. "
            "Ulangi pengukuran tinggi/berat dan konsultasikan ke petugas kesehatan."
        )
    return comparison


def _mpasi_phase(age: int) -> str:
    if age < 6:
        return "ASI eksklusif sesuai anjuran tenaga kesehatan."
    if age <= 8:
        return "MPASI awal dengan tekstur lumat/saring sesuai kesiapan anak."
    if age <= 11:
        return "MPASI tekstur cincang halus atau makanan lunak."
    if age <= 23:
        return "Makanan keluarga yang disesuaikan tekstur dan porsinya."
    return "Makanan keluarga bergizi seimbang."


def _food_list(age: int, status: str) -> list[str]:
    if age < 6:
        return [
            "ASI eksklusif bila memungkinkan",
            "Konsultasi ke bidan/dokter bila ada masalah menyusu atau berat badan",
        ]

    foods = [
        "Protein hewani seperti telur, ikan, ayam, daging, atau hati ayam sesuai usia",
        "Protein nabati seperti tempe, tahu, dan kacang-kacangan yang aman untuk anak",
        "Karbohidrat seperti nasi, kentang, jagung, ubi, atau bubur sesuai usia",
        "Sayur dan buah untuk variasi vitamin dan mineral",
        "Lemak sehat dari santan, minyak, alpukat, atau sumber lain sesuai kebiasaan keluarga",
    ]
    if status in {"stunted", "severely stunted"}:
        foods.insert(0, "Utamakan makanan padat gizi dan sumber protein pada setiap makan utama")
    return foods


def _meal_frequency(age: int) -> str:
    if age < 6:
        return "ASI sesuai kebutuhan bayi. Jangan memberikan MPASI sebelum waktunya tanpa arahan tenaga kesehatan."
    if age <= 8:
        return "MPASI 2-3 kali sehari, dapat ditambah 1-2 selingan sesuai kemampuan anak, sambil melanjutkan ASI."
    if age <= 11:
        return "MPASI 3-4 kali sehari dengan 1-2 selingan bergizi, sambil melanjutkan ASI."
    if age <= 23:
        return "Makan utama 3-4 kali sehari dengan 1-2 selingan bergizi."
    return "Makan utama 3 kali sehari dengan 1-2 selingan bergizi dan minum cukup."


def get_nutrition_recommendation(
    stunting_status: str,
    age: int,
    weight: float,
    gender: str,
    height: float,
    tb_normal: Optional[float],
    bb_normal: Optional[float],
) -> Dict[str, Any]:
    if stunting_status == "severely stunted":
        description = (
            "Risiko tinggi terdeteksi. Segera konsultasikan ke Posyandu atau Puskesmas. "
            "Pemenuhan gizi perlu dipantau bersama petugas kesehatan."
        )
        notes = "Jangan menunda pemeriksaan lanjutan. Catat pola makan, tinggi, dan berat anak sebelum konsultasi."
    elif stunting_status == "stunted":
        description = (
            "Anak perlu pemantauan lebih lanjut. Perbaiki kualitas makanan harian dan konsultasikan "
            "bila tinggi/berat tidak membaik."
        )
        notes = "Pantau pertumbuhan setiap bulan dan prioritaskan makanan padat gizi sesuai usia."
    elif stunting_status == "tall":
        description = "Pertumbuhan tinggi berada di atas rata-rata. Tetap jaga asupan seimbang dan pantau proporsi tinggi/berat."
        notes = "Konsultasikan bila pola pertumbuhan tampak sangat berbeda dari bulan sebelumnya."
    else:
        description = "Pertumbuhan tampak dalam kategori aman. Pertahankan pola makan bergizi seimbang dan pemantauan rutin."
        notes = "Lanjutkan kebiasaan makan sehat, kebersihan, imunisasi, dan kunjungan Posyandu."

    if bb_normal is not None and weight < (bb_normal * 0.85):
        notes += " Berat badan tampak lebih rendah dari rata-rata, sehingga asupan energi dan protein perlu diperhatikan."
    if tb_normal is not None and height < (tb_normal * 0.9):
        notes += " Tinggi badan tampak lebih rendah dari rata-rata, sehingga pemantauan tinggi berkala disarankan."

    return {
        "description": description,
        "mpasi_phase": _mpasi_phase(age),
        "food": _food_list(age, stunting_status),
        "frequency": _meal_frequency(age),
        "supplements": (
            "Konsultasikan penggunaan suplemen dengan dokter, bidan, ahli gizi, atau petugas Puskesmas."
        ),
        "notes": notes,
        "calories_target": (
            "Kebutuhan energi berbeda menurut usia, aktivitas, dan kondisi anak. Mintalah target personal ke ahli gizi atau Puskesmas."
        ),
        "protein_target": (
            "Utamakan sumber protein dalam menu harian sesuai usia anak. Target personal sebaiknya ditentukan petugas kesehatan."
        ),
        "fluid_target": (
            "Cukupi cairan sesuai usia dan kondisi anak. Untuk bayi, ikuti anjuran ASI dari tenaga kesehatan."
        ),
    }


def _legacy_recommendation(summary: Dict[str, str], nutrition: Dict[str, Any], comparison: Dict[str, Any]) -> str:
    parts = [
        summary["next_action"],
        nutrition["description"],
        comparison["overall_explanation"],
    ]
    if comparison.get("warning"):
        parts.append(str(comparison["warning"]))
    return " ".join(parts)


@lru_cache(maxsize=8)
def _load_json(path: Path) -> Optional[Dict[str, Any]]:
    if not path.exists():
        return None
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


@lru_cache(maxsize=1)
def _load_labels() -> list[str]:
    if LABELS_PATH.exists():
        with LABELS_PATH.open("r", encoding="utf-8") as file:
            labels = json.load(file)
        if isinstance(labels, list) and labels:
            return labels
    return DEFAULT_LABELS


def _sanitize_public_metadata(value: Any, key: str = "") -> Any:
    if isinstance(value, dict):
        return {
            item_key: _sanitize_public_metadata(item_value, item_key)
            for item_key, item_value in value.items()
        }
    if isinstance(value, list):
        return [_sanitize_public_metadata(item) for item in value]
    if isinstance(value, str) and ("path" in key.lower() or "file" in key.lower()):
        return Path(value).name
    return value


def _is_pipeline_model(model: Any) -> bool:
    return hasattr(model, "named_steps")


@lru_cache(maxsize=1)
def _load_model() -> Any:
    return joblib.load(MODEL_PATH)


@lru_cache(maxsize=1)
def _load_scaler() -> Any:
    return joblib.load(SCALER_PATH)


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
        scaler = _load_scaler()
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


def _build_prediction_response(
    payload: PredictionRequest,
    status: str,
    confidence: Optional[float],
    model_mode: str,
    growth_notes: Dict[str, float],
    fallback_note: Optional[str] = None,
) -> PredictionResponse:
    normal_values = _load_normal_values()
    tb_normal, bb_normal = get_normal_values(payload.age_month, payload.gender, normal_values)
    comparison = build_growth_comparison(
        payload.age_month,
        payload.gender,
        payload.height_cm,
        payload.weight_kg,
        tb_normal,
        bb_normal,
    )
    comparison = _add_status_warning(status, comparison)
    summary = summary_for_status(status)
    nutrition = get_nutrition_recommendation(
        status,
        payload.age_month,
        payload.weight_kg,
        payload.gender,
        payload.height_cm,
        tb_normal,
        bb_normal,
    )
    recommendation = _legacy_recommendation(summary, nutrition, comparison)
    if fallback_note:
        recommendation = f"{recommendation} Catatan sistem: {fallback_note}"

    technical_details = {
        **growth_notes,
        "confidence_percentage": round(float(confidence * 100), 2) if confidence is not None else None,
        "model_mode": model_mode,
        "normal_values_available": normal_values is not None,
    }

    return PredictionResponse(
        nutrition_status=status,
        risk_level=risk_level_for_status(status),
        confidence=confidence,
        summary=summary,
        comparison=comparison,
        nutrition_recommendation=nutrition,
        recommendation=recommendation,
        growth_notes=growth_notes,
        technical_details=technical_details,
        model_mode=model_mode,
        disclaimer=DISCLAIMER,
    )


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
            model = _load_model()
            metrics = _load_json(METRICS_PATH)
            model_mode = _model_mode_from_metrics(metrics, model)
            status, confidence = _predict_with_artifact(model, payload, record, model_mode)
            return _build_prediction_response(payload, status, confidence, model_mode, growth_notes)
        except Exception:
            logger.exception("Model inference failed; using the rule-based fallback.")
            status = _fallback_status(
                payload.age_month,
                payload.gender,
                payload.height_cm,
                payload.weight_kg,
            )
            return _build_prediction_response(
                payload,
                status,
                None,
                "rule-based-fallback",
                growth_notes,
                "model scikit-learn belum dapat digunakan; hasil memakai fallback demo.",
            )

    status = _fallback_status(payload.age_month, payload.gender, payload.height_cm, payload.weight_kg)
    return _build_prediction_response(
        payload,
        status,
        None,
        "rule-based-fallback",
        growth_notes,
        "belum ada artefak model terlatih, sehingga hasil memakai fallback demo.",
    )


def get_model_info() -> ModelInfoResponse:
    metrics = _load_json(METRICS_PATH)
    labels = _load_labels()
    artifact_status = {
        "model_available": MODEL_PATH.exists(),
        "scaler_available": SCALER_PATH.exists(),
        "ready_for_inference": MODEL_PATH.exists(),
        "format": "joblib",
    }
    model_name = "Fallback demo rule"
    feature_importance = None
    uses_external_estimator = False
    active_model_mode = _model_mode_from_metrics(metrics)

    if MODEL_PATH.exists():
        try:
            model = _load_model()
            model_name = model.__class__.__name__
            artifact_status["model_container"] = (
                "pipeline" if _is_pipeline_model(model) else "estimator"
            )
            artifact_status["uses_separate_scaler"] = (
                not _is_pipeline_model(model) and SCALER_PATH.exists()
            )
            uses_external_estimator = bool(artifact_status["uses_separate_scaler"])
            active_model_mode = _model_mode_from_metrics(metrics, model)
        except Exception:
            logger.exception("Model metadata loading failed.")
            artifact_status["load_warning"] = "Model artifact could not be loaded."

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

    metrics = _sanitize_public_metadata(metrics)

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
