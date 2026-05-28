import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Tuple

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeClassifier

from app.ml.features import GrowthFeatureEngineer


BACKEND_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BACKEND_DIR / "data"
ARTIFACT_DIR = Path(__file__).resolve().parent / "model_artifacts"
MODEL_PATH = ARTIFACT_DIR / "stunting_model.joblib"
METRICS_PATH = ARTIFACT_DIR / "metrics.json"
LABELS_PATH = ARTIFACT_DIR / "labels.json"

FEATURES = ["age_month", "gender", "height_cm"]
TARGET = "nutrition_status"
LABEL_ORDER = ["severely stunted", "stunted", "normal", "tall"]

COLUMN_ALIASES = {
    "age": "age_month",
    "age (month)": "age_month",
    "age_month": "age_month",
    "age month": "age_month",
    "gender": "gender",
    "height": "height_cm",
    "height (cm)": "height_cm",
    "height_cm": "height_cm",
    "height cm": "height_cm",
    "nutrition status": "nutrition_status",
    "nutrition_status": "nutrition_status",
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
            f"No CSV file found in {DATA_DIR}. Download the Kaggle dataset or use sample_stunting_data.csv."
        )
    return candidates[0]


def normalize_columns(raw: pd.DataFrame) -> pd.DataFrame:
    rename_map = {}
    for column in raw.columns:
        key = str(column).strip().lower()
        if key in COLUMN_ALIASES:
            rename_map[column] = COLUMN_ALIASES[key]

    data = raw.rename(columns=rename_map)
    missing = [column for column in FEATURES + [TARGET] if column not in data.columns]
    if missing:
        raise ValueError(f"Missing required columns after normalization: {missing}")

    return data[FEATURES + [TARGET]].copy()


def clean_data(raw: pd.DataFrame) -> pd.DataFrame:
    data = normalize_columns(raw)
    data["age_month"] = pd.to_numeric(data["age_month"], errors="coerce")
    data["height_cm"] = pd.to_numeric(data["height_cm"], errors="coerce")
    data["gender"] = data["gender"].astype(str).str.strip().str.lower().map(GENDER_MAP)
    data["nutrition_status"] = (
        data["nutrition_status"].astype(str).str.strip().str.lower().map(STATUS_MAP)
    )

    data = data.dropna(subset=FEATURES + [TARGET])
    data = data[(data["age_month"] >= 0) & (data["age_month"] <= 60)]
    data = data[(data["height_cm"] > 20) & (data["height_cm"] < 150)]
    data["age_month"] = data["age_month"].astype(int)
    data["height_cm"] = data["height_cm"].astype(float)

    counts = data[TARGET].value_counts()
    if data.empty:
        raise ValueError("No valid rows remain after cleaning.")
    if counts.min() < 2:
        raise ValueError(
            "Each nutrition status needs at least 2 rows for stratified splitting. "
            f"Current counts: {counts.to_dict()}"
        )

    return data.reset_index(drop=True)


def make_one_hot_encoder() -> OneHotEncoder:
    try:
        return OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:
        return OneHotEncoder(handle_unknown="ignore", sparse=False)


def build_pipeline(model) -> Pipeline:
    preprocess = ColumnTransformer(
        transformers=[
            ("gender", make_one_hot_encoder(), ["gender"]),
            ("growth", GrowthFeatureEngineer(), FEATURES),
        ]
    )
    return Pipeline(
        steps=[
            ("preprocess", preprocess),
            ("model", model),
        ]
    )


def candidate_models() -> Dict[str, Pipeline]:
    return {
        "DecisionTreeClassifier": build_pipeline(
            DecisionTreeClassifier(random_state=42, max_depth=8, class_weight="balanced")
        ),
        "RandomForestClassifier": build_pipeline(
            RandomForestClassifier(
                n_estimators=200,
                random_state=42,
                class_weight="balanced",
                min_samples_leaf=2,
            )
        ),
    }


def evaluate_model(model: Pipeline, x_test: pd.DataFrame, y_test: pd.Series) -> Dict:
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


def extract_feature_importance(model: Pipeline) -> list[Dict[str, float]] | None:
    classifier = model.named_steps["model"]
    if not hasattr(classifier, "feature_importances_"):
        return None

    preprocess = model.named_steps["preprocess"]
    names = preprocess.get_feature_names_out()
    importances = classifier.feature_importances_
    pairs = [
        {
            "feature": str(name)
            .replace("gender__", "")
            .replace("growth__", "")
            .replace("numeric__", ""),
            "importance": round(float(score), 6),
        }
        for name, score in zip(names, importances)
    ]
    return sorted(pairs, key=lambda item: item["importance"], reverse=True)


def train(csv_path: Path) -> Tuple[Pipeline, Dict]:
    raw = pd.read_csv(csv_path)
    data = clean_data(raw)
    x = data[FEATURES]
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
    for name, model in candidate_models().items():
        model.fit(x_train, y_train)
        metrics = evaluate_model(model, x_test, y_test)
        results[name] = metrics
        if metrics["macro_f1"] > best_f1:
            best_f1 = metrics["macro_f1"]
            best_name = name
            best_model = model

    assert best_model is not None and best_name is not None
    metrics = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "dataset_file": str(csv_path),
        "row_count": int(len(data)),
        "train_size": int(len(x_train)),
        "test_size": int(len(x_test)),
        "best_model": best_name,
        "best_model_metrics": results[best_name],
        "candidate_results": results,
        "features": FEATURES,
        "labels": LABEL_ORDER,
        "class_counts": data[TARGET].value_counts().reindex(LABEL_ORDER, fill_value=0).to_dict(),
        "feature_importance": extract_feature_importance(best_model),
    }
    return best_model, metrics


def save_artifacts(model: Pipeline, metrics: Dict) -> None:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    with METRICS_PATH.open("w", encoding="utf-8") as file:
        json.dump(metrics, file, indent=2)
    with LABELS_PATH.open("w", encoding="utf-8") as file:
        json.dump(LABEL_ORDER, file, indent=2)


def main() -> None:
    parser = argparse.ArgumentParser(description="Train StuntGuard stunting screening model.")
    parser.add_argument("--csv", type=Path, default=None, help="Path to the dataset CSV.")
    args = parser.parse_args()

    csv_path = args.csv or find_default_csv()
    if not csv_path.is_absolute():
        csv_path = Path.cwd() / csv_path

    model, metrics = train(csv_path)
    save_artifacts(model, metrics)

    print(f"Saved model to {MODEL_PATH}")
    print(f"Best model: {metrics['best_model']}")
    print(json.dumps(metrics["best_model_metrics"], indent=2))


if __name__ == "__main__":
    main()
