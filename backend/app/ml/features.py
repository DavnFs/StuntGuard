import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin


class GrowthFeatureEngineer(BaseEstimator, TransformerMixin):
    """Derive demo screening features from age, gender, and height only."""

    def fit(self, x, y=None):
        return self

    def transform(self, x):
        frame = pd.DataFrame(x).copy()
        age = pd.to_numeric(frame["age_month"], errors="coerce").fillna(0).astype(float)
        height = pd.to_numeric(frame["height_cm"], errors="coerce").fillna(0).astype(float)
        gender_adjustment = frame["gender"].map({"male": 0.8, "female": 0.0}).fillna(0.0).astype(float)

        expected = np.where(
            age <= 24,
            50.0 + (age * 1.55) + gender_adjustment,
            87.0 + ((age - 24) * 0.62) + gender_adjustment,
        )
        height_gap = height - expected
        height_ratio = height / np.maximum(expected, 1)

        return np.column_stack([age, height, height_gap, height_ratio])

    def get_feature_names_out(self, input_features=None):
        return np.array(["age_month", "height_cm", "height_gap_expected", "height_expected_ratio"])
