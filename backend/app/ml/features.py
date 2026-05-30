import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin


class GrowthFeatureEngineer(BaseEstimator, TransformerMixin):
    """Derive screening features from age, gender, height, and weight."""

    def fit(self, x, y=None):
        return self

    def transform(self, x):
        frame = pd.DataFrame(x).copy()
        age = pd.to_numeric(frame["age_month"], errors="coerce").fillna(0).astype(float)
        height = pd.to_numeric(frame["height_cm"], errors="coerce").fillna(0).astype(float)
        weight = pd.to_numeric(frame["weight_kg"], errors="coerce").fillna(0).astype(float)
        gender_adjustment = frame["gender"].map({"male": 0.8, "female": 0.0}).fillna(0.0).astype(float)

        expected_height = np.where(
            age <= 24,
            50.0 + (age * 1.55) + gender_adjustment,
            87.0 + ((age - 24) * 0.62) + gender_adjustment,
        )
        expected_weight = np.where(
            age <= 24,
            3.2 + (age * 0.32),
            10.8 + ((age - 24) * 0.18),
        )
        height_gap = height - expected_height
        height_ratio = height / np.maximum(expected_height, 1)
        weight_gap = weight - expected_weight
        weight_ratio = weight / np.maximum(expected_weight, 1)

        return np.column_stack([age, height, weight, height_gap, height_ratio, weight_gap, weight_ratio])

    def get_feature_names_out(self, input_features=None):
        return np.array(
            [
                "age_month",
                "height_cm",
                "weight_kg",
                "height_gap_expected",
                "height_expected_ratio",
                "weight_gap_expected",
                "weight_expected_ratio",
            ]
        )


class HeightOnlyFeatureEngineer(BaseEstimator, TransformerMixin):
    """Derive fallback screening features when a dataset has no weight column."""

    def fit(self, x, y=None):
        return self

    def transform(self, x):
        frame = pd.DataFrame(x).copy()
        age = pd.to_numeric(frame["age_month"], errors="coerce").fillna(0).astype(float)
        height = pd.to_numeric(frame["height_cm"], errors="coerce").fillna(0).astype(float)
        gender_adjustment = frame["gender"].map({"male": 0.8, "female": 0.0}).fillna(0.0).astype(float)

        expected_height = np.where(
            age <= 24,
            50.0 + (age * 1.55) + gender_adjustment,
            87.0 + ((age - 24) * 0.62) + gender_adjustment,
        )
        height_gap = height - expected_height
        height_ratio = height / np.maximum(expected_height, 1)

        return np.column_stack([age, height, height_gap, height_ratio])

    def get_feature_names_out(self, input_features=None):
        return np.array(
            [
                "age_month",
                "height_cm",
                "height_gap_expected",
                "height_expected_ratio",
            ]
        )
