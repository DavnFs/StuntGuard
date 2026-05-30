from fastapi.testclient import TestClient
from uuid import uuid4

from app.main import app
from app import schemas
from app.services.chatbot_guardrails import classify_message


client = TestClient(app)


def chat_headers():
    return {"X-Forwarded-For": f"test-{uuid4()}", "X-StuntGuard-Role": "guest"}


def disable_llm(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    monkeypatch.setenv("CHAT_RATE_LIMIT_ENABLED", "true")
    monkeypatch.setenv("CHAT_GUEST_DAILY_LIMIT", "10")
    monkeypatch.setenv("CHAT_GUEST_MINUTE_LIMIT", "3")
    monkeypatch.setenv("CHAT_LIMIT_COUNT_SOURCES", "all")
    for key in ("GEMINI_API_KEY", "GROQ_API_KEY", "OPENAI_API_KEY", "OPENROUTER_API_KEY"):
        monkeypatch.delenv(key, raising=False)


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


def test_chatbot_blocks_out_of_scope(monkeypatch):
    disable_llm(monkeypatch)
    response = client.post(
        "/chatbot",
        json={"message": "Tolong buatkan kode game investasi"},
        headers=chat_headers(),
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "guardrail"
    assert payload["safety_level"] == "blocked"
    assert "stunting" in payload["reply"].lower()


def test_chatbot_blocks_medication_dosage(monkeypatch):
    disable_llm(monkeypatch)
    response = client.post(
        "/chatbot",
        json={"message": "Berapa dosis vitamin supaya anak tidak stunting?"},
        headers=chat_headers(),
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "guardrail"
    assert "tidak dapat memberikan dosis" in payload["reply"].lower()


def test_chatbot_emergency_guidance(monkeypatch):
    disable_llm(monkeypatch)
    response = client.post(
        "/chatbot",
        json={"message": "Anak saya sesak dan muntah terus"},
        headers=chat_headers(),
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "guardrail"
    assert payload["safety_level"] == "urgent"
    assert "segera bawa" in payload["reply"].lower()


def test_chatbot_rule_based_fallback_with_context(monkeypatch):
    disable_llm(monkeypatch)
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
        headers=chat_headers(),
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] in {"rule-based", "llm"}
    assert payload["safety_level"] == "safe"
    assert payload["suggested_actions"]


def test_chatbot_allows_long_term_followup_with_context(monkeypatch):
    disable_llm(monkeypatch)
    context = {
        "age_month": 24,
        "gender": "male",
        "height_cm": 76.0,
        "weight_kg": 9.0,
        "nutrition_status": "severely stunted",
        "risk_level": "high",
    }
    classification = classify_message(
        "apabila dibiarkan hingga dewasa efeknya apa saja",
        schemas.ChatChildContext(**context),
    )
    assert classification["intent"] == "long_term_effects"
    assert classification["blocked"] is False
    assert classification["out_of_scope"] is False

    response = client.post(
        "/chatbot",
        json={"message": "apabila dibiarkan hingga dewasa efeknya apa saja", "child_context": context},
        headers=chat_headers(),
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] in {"rule-based", "llm"}
    assert "jangka panjang" in payload["reply"].lower()
    assert "posyandu" in payload["reply"].lower() or "puskesmas" in payload["reply"].lower()
    assert payload["suggested_actions"] == [
        "Konsultasikan hasil skrining ke Posyandu/Puskesmas",
        "Pantau tinggi dan berat badan setiap bulan",
        "Perhatikan asupan protein dan gizi seimbang sesuai usia",
    ]


def test_chatbot_guest_minute_rate_limit(monkeypatch):
    disable_llm(monkeypatch)
    headers = {"X-Forwarded-For": f"limit-{uuid4()}"}
    for _ in range(3):
        response = client.post("/chatbot", json={"message": "Apa itu stunting?"}, headers=headers)
        assert response.status_code == 200
        assert response.json()["source"] == "rule-based"

    response = client.post("/chatbot", json={"message": "Apa itu stunting?"}, headers=headers)
    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "rate-limit"
    assert payload["safety_level"] == "limited"
