from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_predict():
    response = client.post(
        "/predict",
        json={"age_month": 24, "gender": "female", "height_cm": 78, "weight_kg": 9.2},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["nutrition_status"] in {"severely stunted", "stunted", "normal", "tall"}
    assert payload["risk_level"] in {"high", "medium", "low", "monitor"}
    assert payload["model_mode"] in {"full-growth-model", "height-only-fallback-model", "rule-based-fallback"}
    assert "height_gap_expected" in payload["growth_notes"]
    assert "weight_gap_expected" in payload["growth_notes"]
    assert "Puskesmas" in payload["disclaimer"]
