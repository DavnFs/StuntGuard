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
    assert {"title", "description", "next_action"}.issubset(payload["summary"])
    assert "tb_explanation" in payload["comparison"]
    assert "bb_explanation" in payload["comparison"]
    assert "food" in payload["nutrition_recommendation"]
    assert "supplements" in payload["nutrition_recommendation"]
    assert "technical_details" in payload
    assert "height_gap_expected" in payload["growth_notes"]
    assert "weight_gap_expected" in payload["growth_notes"]
    assert "Puskesmas" in payload["disclaimer"]


def test_chatbot_blocks_out_of_scope():
    response = client.post("/chatbot", json={"message": "Tolong buatkan kode game investasi"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "guardrail"
    assert payload["safety_level"] == "blocked"
    assert "stunting" in payload["reply"].lower()


def test_chatbot_blocks_medication_dosage():
    response = client.post("/chatbot", json={"message": "Berapa dosis vitamin supaya anak tidak stunting?"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "guardrail"
    assert "tidak dapat memberikan dosis" in payload["reply"].lower()


def test_chatbot_emergency_guidance():
    response = client.post("/chatbot", json={"message": "Anak saya sesak dan muntah terus"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "guardrail"
    assert payload["safety_level"] == "urgent"
    assert "segera bawa" in payload["reply"].lower()


def test_chatbot_rule_based_fallback_with_context():
    response = client.post(
        "/chatbot",
        json={
            "message": "Anak saya hasilnya stunted, makanan apa yang cocok?",
            "child_context": {
                "age_month": 24,
                "gender": "male",
                "height_cm": 82.5,
                "weight_kg": 10.4,
                "nutrition_status": "stunted",
                "risk_level": "medium",
            },
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] in {"rule-based", "llm"}
    assert payload["safety_level"] == "safe"
    assert payload["suggested_actions"]
