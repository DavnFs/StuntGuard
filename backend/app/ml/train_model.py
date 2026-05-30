import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Tuple

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesClassifier, HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
)
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier

from app.ml.features import GrowthFeatureEngineer, HeightOnlyFeatureEngineer


BACKEND_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BACKEND_DIR / "data"
ARTIFACT_DIR = Path(__file__).resolve().parent / "model_artifacts"
MODEL_PATH = ARTIFACT_DIR / "stunting_model.joblib"
METRICS_PATH = ARTIFACT_DIR / "metrics.json"
LABELS_PATH = ARTIFACT_DIR / "labels.json"
NORMAL_VALUES_PATH = ARTIFACT_DIR / "normal_values.csv"

FULL_FEATURES = ["age_month", "gender", "height_cm", "weight_kg"]
HEIGHT_ONLY_FEATURES = ["age_month", "gender", "height_cm"]
TARGET = "nutrition_status"
LABEL_ORDER = ["severely stunted", "stunted", "normal", "tall"]

COLUMN_ALIASES = {
    "age": "age_month",
    "age (month)": "age_month",
    "age_month": "age_month",
    "age month": "age_month",
    "umur": "age_month",
    "umur (bulan)": "age_month",
    "gender": "gender",
    "jenis kelamin": "gender",
    "sex": "gender",
    "height": "height_cm",
    "height (cm)": "height_cm",
    "height_cm": "height_cm",
    "height cm": "height_cm",
    "tinggi badan": "height_cm",
    "tinggi badan (cm)": "height_cm",
    "weight": "weight_kg",
    "weight (kg)": "weight_kg",
    "weight_kg": "weight_kg",
    "weight kg": "weight_kg",
    "berat badan": "weight_kg",
    "berat badan (kg)": "weight_kg",
    "nutrition status": "nutrition_status",
    "nutrition_status": "nutrition_status",
    "stunting": "nutrition_status",
    "status": "nutrition_status",
}

GENDER_MAP = {
    "male": "male",
    "m": "male",
    "laki-laki": "male",
    "laki laki": "male",
    "pria": "male",
    "female": "female",
    "f": "female",
    "perempuan": "female",
    "wanita": "female",
}

STATUS_MAP = {
    "severely stunted": "severely stunted",
    "severely_stunted": "severely stunted",
    "sangat pendek": "severely stunted",
    "stunted": "stunted",
    "pendek": "stunted",
    "normal": "normal",
    "tall": "tall",
    "tinggi": "tall",
}


def find_default_csv() -> Path:
    candidates = sorted(DATA_DIR.glob("*.csv"), key=lambda path: path.stat().st_size, reverse=True)
    if not candidates:
        raise FileNotFoundError(
            f"No CSV file found in {DATA_DIR}. Download the dataset or use sample_stunting_data.csv."
        )
    return candidates[0]


def normalize_columns(raw: pd.DataFrame) -> tuple[pd.DataFrame, bool]:
    rename_map = {}
    for column in raw.columns:
        key = str(column).strip().lower()
        if key in COLUMN_ALIASES:
            rename_map[column] = COLUMN_ALIASES[key]

    data = raw.rename(columns=rename_map)
    weight_available = "weight_kg" in data.columns
    missing = [column for column in HEIGHT_ONLY_FEATURES + [TARGET] if column not in data.columns]
    if missing:
        raise ValueError(f"Missing required columns after normalization: {missing}")

    columns = (FULL_FEATURES if weight_available else HEIGHT_ONLY_FEATURES) + [TARGET]
    return data[columns].copy(), weight_available


def clean_data(raw: pd.DataFrame) -> tuple[pd.DataFrame, bool, list[str], str]:
    data, weight_available = normalize_columns(raw)
    data["age_month"] = pd.to_numeric(data["age_month"], errors="coerce")
    data["height_cm"] = pd.to_numeric(data["height_cm"], errors="coerce")
    if weight_available:
        data["weight_kg"] = pd.to_numeric(data["weight_kg"], errors="coerce")
    data["gender"] = data["gender"].astype(str).str.strip().str.lower().map(GENDER_MAP)
    data["nutrition_status"] = (
        data["nutrition_status"].astype(str).str.strip().str.lower().map(STATUS_MAP)
    )

    features = FULL_FEATURES if weight_available else HEIGHT_ONLY_FEATURES
    model_mode = "full-growth-model" if weight_available else "height-only-fallback-model"

    data = data.dropna(subset=features + [TARGET])
    data = data[(data["age_month"] >= 0) & (data["age_month"] <= 60)]
    data = data[(data["height_cm"] > 20) & (data["height_cm"] < 150)]
    if weight_available:
        data = data[(data["weight_kg"] > 1) & (data["weight_kg"] < 60)]
    data["age_month"] = data["age_month"].astype(int)
    data["height_cm"] = data["height_cm"].astype(float)
    if weight_available:
        data["weight_kg"] = data["weight_kg"].astype(float)

    counts = data[TARGET].value_counts()
    if data.empty:
        raise ValueError("No valid rows remain after cleaning.")
    if counts.min() < 2:
        raise ValueError(
            "Each nutrition status needs at least 2 rows for stratified splitting. "
            f"Current counts: {counts.to_dict()}"
        )

    if not weight_available:
        print(
            "WARNING: No weight_kg column found. Training height-only fallback model. "
            "Do not report these metrics as full growth model metrics."
        )

    return data.reset_index(drop=True), weight_available, features, model_mode


def make_one_hot_encoder() -> OneHotEncoder:
    try:
        return OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:
        return OneHotEncoder(handle_unknown="ignore", sparse=False)


def build_pipeline(
    model,
    features: list[str],
    model_mode: str,
    scale_numeric: bool = False,
) -> Pipeline:
    numeric_transformer = StandardScaler() if scale_numeric else "passthrough"
    numeric_columns = ["age_month", "height_cm", "weight_kg"] if model_mode == "full-growth-model" else ["age_month", "height_cm"]
    growth_transformer = GrowthFeatureEngineer() if model_mode == "full-growth-model" else HeightOnlyFeatureEngineer()
    preprocess = ColumnTransformer(
        transformers=[
            ("gender", make_one_hot_encoder(), ["gender"]),
            ("numeric", numeric_transformer, numeric_columns),
            ("growth", growth_transformer, features),
        ]
    )
    return Pipeline(
        steps=[
            ("preprocess", preprocess),
            ("model", model),
        ]
    )


def candidate_models(features: list[str], model_mode: str) -> Dict[str, Pipeline]:
    return {
        "DecisionTreeClassifier": build_pipeline(
            DecisionTreeClassifier(random_state=42, max_depth=10, class_weight="balanced"),
            features,
            model_mode,
        ),
        "RandomForestClassifier": build_pipeline(
            RandomForestClassifier(
                n_estimators=300,
                random_state=42,
                class_weight="balanced",
                min_samples_leaf=1,
                n_jobs=-1,
            ),
            features,
            model_mode,
        ),
        "ExtraTreesClassifier": build_pipeline(
            ExtraTreesClassifier(
                n_estimators=300,
                random_state=42,
                class_weight="balanced",
                min_samples_leaf=1,
                n_jobs=-1,
            ),
            features,
            model_mode,
        ),
        "HistGradientBoostingClassifier": build_pipeline(
            HistGradientBoostingClassifier(random_state=42, max_iter=200, learning_rate=0.08),
            features,
            model_mode,
        ),
        "LogisticRegression": build_pipeline(
            LogisticRegression(max_iter=2000, class_weight="balanced"),
            features,
            model_mode,
            scale_numeric=True,
        ),
        "MLPClassifier": build_pipeline(
            MLPClassifier(
                hidden_layer_sizes=(64, 32, 16),
                activation="relu",
                solver="adam",
                batch_size=64,
                max_iter=300,
                early_stopping=True,
                n_iter_no_change=20,
                random_state=42,
            ),
            features,
            model_mode,
            scale_numeric=True,
        ),
    }


def evaluate_model(model: Pipeline, x_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, Any]:
    predictions = model.predict(x_test)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_test,
        predictions,
        labels=LABEL_ORDER,
        average="macro",
        zero_division=0,
    )
    return {
        "accuracy": round(float(accuracy_score(y_test, predictions)), 6),
        "macro_precision": round(float(precision), 6),
        "macro_recall": round(float(recall), 6),
        "macro_f1": round(float(f1), 6),
        "confusion_matrix": confusion_matrix(y_test, predictions, labels=LABEL_ORDER).tolist(),
        "classification_report": classification_report(
            y_test,
            predictions,
            labels=LABEL_ORDER,
            output_dict=True,
            zero_division=0,
        ),
    }


def _clean_feature_name(name: str) -> str:
    return (
        name.replace("gender__", "")
        .replace("numeric__", "")
        .replace("growth__", "")
    )


def extract_feature_importance(model: Pipeline) -> list[Dict[str, float]] | None:
    classifier = model.named_steps["model"]
    if not hasattr(classifier, "feature_importances_"):
        return None

    preprocess = model.named_steps["preprocess"]
    names = [_clean_feature_name(str(name)) for name in preprocess.get_feature_names_out()]
    importances = classifier.feature_importances_
    pairs = [
        {"feature": name, "importance": round(float(score), 6)}
        for name, score in zip(names, importances)
    ]
    return sorted(pairs, key=lambda item: item["importance"], reverse=True)


def calculate_normal_values(data: pd.DataFrame) -> pd.DataFrame:
    normal = data[data[TARGET] == "normal"]
    if normal.empty:
        return pd.DataFrame(columns=["age_month", "gender", "height_cm", "weight_kg"])
    aggregations = {"height_cm": "mean"}
    if "weight_kg" in normal.columns:
        aggregations["weight_kg"] = "mean"
    result = (
        normal.groupby(["age_month", "gender"], as_index=False)
        .agg(aggregations)
        .sort_values(["gender", "age_month"])
    )
    if "weight_kg" not in result.columns:
        result["weight_kg"] = pd.NA
    return result


def train(csv_path: Path) -> Tuple[Pipeline, Dict[str, Any], pd.DataFrame]:
    raw = pd.read_csv(csv_path)
    data, weight_available, features, model_mode = clean_data(raw)
    x = data[features]
    y = data[TARGET]

    test_size = max(0.2, len(LABEL_ORDER) / len(data))
    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=test_size,
        random_state=42,
        stratify=y,
    )

    results = {}
    best_name = None
    best_model = None
    best_f1 = -1.0
    for name, model in candidate_models(features, model_mode).items():
        try:
            model.fit(x_train, y_train)
            metrics = evaluate_model(model, x_test, y_test)
        except Exception as exc:
            results[name] = {"error": str(exc)}
            continue
        results[name] = metrics
        if metrics["macro_f1"] > best_f1:
            best_f1 = metrics["macro_f1"]
            best_name = name
            best_model = model

    if best_model is None or best_name is None:
        raise RuntimeError(f"All candidate models failed: {results}")
    metrics = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "dataset_file": str(csv_path),
        "row_count": int(len(data)),
        "train_size": int(len(x_train)),
        "test_size": int(len(x_test)),
        "best_model": best_name,
        "best_model_metrics": results[best_name],
        "candidate_results": results,
        "framework": "scikit-learn",
        "format": "joblib",
        "model_mode": model_mode,
        "weight_available_during_training": weight_available,
        "features": features,
        "trained_features": features,
        "engineered_features": (
            GrowthFeatureEngineer().get_feature_names_out().tolist()
            if model_mode == "full-growth-model"
            else HeightOnlyFeatureEngineer().get_feature_names_out().tolist()
        ),
        "labels": LABEL_ORDER,
        "class_counts": data[TARGET].value_counts().reindex(LABEL_ORDER, fill_value=0).to_dict(),
        "feature_importance": extract_feature_importance(best_model),
        "training_dataset_info": {
            "dataset_file": str(csv_path),
            "row_count": int(len(data)),
            "weight_kg_available": weight_available,
            "model_mode": model_mode,
        },
        "disclaimer": (
            "Metrics are generated from the local dataset used for this run. "
            "The model is for educational screening support, not medical diagnosis. "
            "Height-only fallback metrics must not be presented as full growth model metrics."
        ),
    }
    return best_model, metrics, calculate_normal_values(data)


def save_artifacts(model: Pipeline, metrics: Dict[str, Any], normal_values: pd.DataFrame) -> None:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    normal_values.to_csv(NORMAL_VALUES_PATH, index=False)
    with METRICS_PATH.open("w", encoding="utf-8") as file:
        json.dump(metrics, file, indent=2)
    with LABELS_PATH.open("w", encoding="utf-8") as file:
        json.dump(LABEL_ORDER, file, indent=2)


def main() -> None:
    parser = argparse.ArgumentParser(description="Train StuntGuard scikit-learn stunting screening model.")
    parser.add_argument("--csv", type=Path, default=None, help="Path to the dataset CSV.")
    args = parser.parse_args()

    csv_path = args.csv or find_default_csv()
    if not csv_path.is_absolute():
        csv_path = Path.cwd() / csv_path

    model, metrics, normal_values = train(csv_path)
    save_artifacts(model, metrics, normal_values)

    print(f"Saved model to {MODEL_PATH}")
    print(f"Best model: {metrics['best_model']}")
    print(json.dumps(metrics["best_model_metrics"], indent=2))


if __name__ == "__main__":
    main()
