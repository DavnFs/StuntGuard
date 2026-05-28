from fastapi import APIRouter

from app import schemas
from app.ml.predict import get_model_info, predict_nutrition


router = APIRouter(tags=["prediction"])


@router.post("/predict", response_model=schemas.PredictionResponse)
def predict(payload: schemas.PredictionRequest):
    return predict_nutrition(payload)


@router.get("/model/info", response_model=schemas.ModelInfoResponse)
def model_info():
    return get_model_info()
