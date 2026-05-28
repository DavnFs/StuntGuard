import json
import os
import urllib.error
import urllib.request

from fastapi import APIRouter

from app import schemas
from app.ml.predict import DISCLAIMER


router = APIRouter(tags=["chatbot"])


RULES = [
    (
        ["apa itu stunting", "pengertian stunting", "stunting itu apa"],
        "Stunting adalah kondisi gagal tumbuh pada anak akibat kekurangan gizi kronis dan faktor kesehatan lain dalam waktu lama. Tanda utamanya adalah tinggi badan lebih rendah dari standar usia. Hasil aplikasi ini hanya skrining awal, bukan diagnosis.",
    ),
    (
        ["makanan", "mencegah stunting", "gizi", "mpasi"],
        "Pencegahan stunting dibantu dengan ASI eksklusif sesuai usia, MPASI bergizi seimbang, protein hewani seperti telur, ikan, ayam, daging, tempe, tahu, sayur, buah, serta kebersihan makanan. Sesuaikan dengan usia anak dan arahan tenaga kesehatan.",
    ),
    (
        ["kapan harus ke puskesmas", "periksa", "rujuk", "dokter"],
        "Segera konsultasi ke Puskesmas bila hasil skrining berisiko tinggi, berat atau tinggi badan tidak naik sesuai pemantauan, anak sering sakit, sulit makan, atau orang tua merasa khawatir dengan tumbuh kembang anak.",
    ),
    (
        ["membaca hasil", "hasil prediksi", "risk level", "risiko"],
        "Kategori normal berarti pemantauan rutin tetap dilanjutkan. Stunted menunjukkan risiko sedang dan perlu tindak lanjut. Severely stunted menunjukkan risiko tinggi dan perlu konsultasi segera. Tall perlu dipantau bila pola pertumbuhan tidak biasa.",
    ),
    (
        ["bedanya stunted", "severely stunted", "stunted dan severely"],
        "Stunted menunjukkan tinggi badan lebih rendah dari standar usia, sedangkan severely stunted lebih berat. Keduanya perlu perhatian, tetapi severely stunted harus diprioritaskan untuk tindak lanjut tenaga kesehatan.",
    ),
]

DEFAULT_REPLY = (
    "Saya dapat membantu menjelaskan stunting, makanan pencegahan, kapan perlu ke Puskesmas, "
    "dan cara membaca hasil prediksi. Untuk kondisi anak tertentu, konsultasikan langsung dengan tenaga kesehatan."
)


def rule_based_reply(message: str) -> str:
    normalized = message.strip().lower()
    for keywords, reply in RULES:
        if any(keyword in normalized for keyword in keywords):
            return f"{reply}\n\n{DISCLAIMER}"
    return f"{DEFAULT_REPLY}\n\n{DISCLAIMER}"


def llm_reply(message: str) -> str | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    body = {
        "model": model,
        "input": [
            {
                "role": "system",
                "content": (
                    "Jawab dalam Bahasa Indonesia sebagai edukator gizi Posyandu. "
                    "Berikan informasi umum, aman, singkat, dan selalu arahkan konsultasi ke Puskesmas. "
                    "Jangan memberikan diagnosis medis."
                ),
            },
            {"role": "user", "content": message},
        ],
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, KeyError, json.JSONDecodeError):
        return None

    text = payload.get("output_text")
    if not text:
        chunks = []
        for item in payload.get("output", []):
            for content in item.get("content", []):
                if content.get("type") in {"output_text", "text"}:
                    chunks.append(content.get("text", ""))
        text = "\n".join(chunk for chunk in chunks if chunk)

    if not text:
        return None
    return f"{text.strip()}\n\n{DISCLAIMER}"


@router.post("/chatbot", response_model=schemas.ChatResponse)
def chatbot(payload: schemas.ChatRequest):
    llm = llm_reply(payload.message)
    if llm:
        return schemas.ChatResponse(reply=llm, source="llm")
    return schemas.ChatResponse(reply=rule_based_reply(payload.message), source="rule-based")
