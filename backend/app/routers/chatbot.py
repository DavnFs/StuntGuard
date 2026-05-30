from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app import schemas
from app.database import get_db
from app.ml.predict import DISCLAIMER
from app.services.chat_usage import check_chat_rate_limit, record_chat_usage, resolve_chat_identity
from app.services.chatbot_guardrails import (
    EDUCATION_NOTE,
    build_system_prompt,
    classify_message,
    input_guardrail_reply,
    output_guardrail,
)
from app.services.llm_client import call_llm, configured_provider


router = APIRouter(tags=["chatbot"])


RULES = [
    (
        ["apa itu stunting", "pengertian stunting", "stunting itu apa"],
        "Stunting adalah kondisi gagal tumbuh pada anak akibat kekurangan gizi kronis dan faktor kesehatan lain dalam waktu lama. Tanda utamanya adalah tinggi badan lebih rendah dari standar usia. Hasil aplikasi ini hanya skrining awal, bukan diagnosis.",
        ["Pelajari cara memantau tinggi dan berat anak", "Lakukan pemantauan rutin di Posyandu"],
    ),
    (
        ["anak saya berisiko", "hasilnya stunted", "hasil stunted", "risiko stunting", "severely stunted"],
        "Hasil berisiko pada StuntGuard berarti anak perlu pemantauan lebih lanjut, bukan diagnosis pasti. Langkah terbaik adalah mengulang pemantauan secara rutin dan berkonsultasi ke Posyandu atau Puskesmas.",
        ["Bawa hasil skrining ke Posyandu/Puskesmas", "Pantau tinggi dan berat setiap bulan"],
    ),
    (
        ["makanan", "mencegah stunting", "gizi", "mpasi"],
        "Untuk anak usia 6 bulan ke atas, orang tua dapat memberi makanan bergizi seimbang sesuai usia, seperti telur, ikan, ayam, tahu, tempe, makanan pokok, sayur, dan buah. Untuk bayi di bawah 6 bulan, secara umum dianjurkan ASI eksklusif kecuali ada arahan tenaga kesehatan.",
        ["Sesuaikan makanan dengan usia anak", "Konsultasikan bila anak sulit makan atau berat tidak naik"],
    ),
    (
        ["kapan harus ke puskesmas", "periksa", "rujuk", "dokter"],
        "Konsultasikan ke Posyandu atau Puskesmas bila hasil skrining berisiko, tinggi atau berat badan tidak naik, anak sering sakit, sulit makan, atau orang tua khawatir dengan tumbuh kembang anak.",
        ["Datang ke Posyandu/Puskesmas", "Bawa catatan tinggi dan berat anak"],
    ),
    (
        ["membaca hasil", "hasil prediksi", "risk level", "risiko"],
        "Normal berarti pemantauan rutin tetap dilanjutkan. Tall berarti pertumbuhan tinggi perlu tetap dipantau. Stunted berarti perlu pemantauan lebih lanjut. Severely stunted berarti sebaiknya segera konsultasi ke petugas kesehatan.",
        ["Gunakan hasil sebagai skrining awal", "Konsultasikan hasil berisiko ke petugas kesehatan"],
    ),
    (
        ["bedanya stunted", "severely stunted", "stunted dan severely"],
        "Stunted menunjukkan tinggi badan lebih rendah dari rata-rata anak seusianya, sedangkan severely stunted menunjukkan risiko yang lebih tinggi. Keduanya bukan diagnosis dari aplikasi dan perlu dikonfirmasi oleh tenaga kesehatan.",
        ["Pantau ulang pertumbuhan", "Konsultasikan ke Posyandu/Puskesmas"],
    ),
    (
        ["berat badan", "tinggi badan", "pentingnya berat", "pentingnya tinggi"],
        "Tinggi badan membantu melihat pertumbuhan jangka panjang, sedangkan berat badan membantu melihat kondisi pertumbuhan saat ini. Keduanya sebaiknya dipantau bersama usia dan jenis kelamin.",
        ["Catat tinggi dan berat setiap bulan", "Pastikan pengukuran dilakukan dengan benar"],
    ),
]

DEFAULT_REPLY = (
    "Saya bisa membantu menjelaskan stunting, hasil skrining StuntGuard, makanan bergizi untuk balita, "
    "kapan perlu ke Posyandu/Puskesmas, dan cara memantau pertumbuhan anak."
)


def _append_safety_note(reply: str) -> str:
    text = reply.strip()
    if EDUCATION_NOTE.lower() not in text.lower():
        text = f"{text}\n\n{EDUCATION_NOTE}"
    if "diagnosis medis" not in text.lower():
        text = f"{text}\n\n{DISCLAIMER}"
    return text


def rule_based_reply(message: str, child_context: schemas.ChatChildContext | None = None) -> tuple[str, list[str]]:
    normalized = message.strip().lower()
    for keywords, reply, actions in RULES:
        if any(keyword in normalized for keyword in keywords):
            contextual_note = ""
            if child_context and child_context.nutrition_status in {"stunted", "severely stunted"}:
                contextual_note = (
                    "\n\nKarena konteks skrining menunjukkan risiko, sebaiknya hasil ini dibawa saat konsultasi "
                    "ke Posyandu atau Puskesmas."
                )
            return _append_safety_note(f"{reply}{contextual_note}"), actions

    return _append_safety_note(DEFAULT_REPLY), [
        "Tanyakan usia, tinggi, berat, atau hasil skrining anak",
        "Konsultasikan hasil berisiko ke Posyandu/Puskesmas",
    ]


@router.post("/chatbot", response_model=schemas.ChatResponse)
def chatbot(payload: schemas.ChatRequest, request: Request, db: Session = Depends(get_db)):
    identity = resolve_chat_identity(request)
    provider = configured_provider()
    classification = classify_message(payload.message)
    blocked = input_guardrail_reply(classification)
    if blocked:
        record_chat_usage(db, identity, len(payload.message), provider, "guardrail")
        return schemas.ChatResponse(
            reply=blocked["reply"],
            source="guardrail",
            safety_level=blocked["safety_level"],
            suggested_actions=blocked["suggested_actions"],
        )

    allowed, limit_message = check_chat_rate_limit(db, identity)
    if not allowed:
        return schemas.ChatResponse(
            reply=limit_message or "Batas penggunaan chatbot sudah tercapai.",
            source="rate-limit",
            safety_level="limited",
            suggested_actions=["Gunakan fitur konsultasi ke petugas bila membutuhkan bantuan lanjutan"],
        )

    system_prompt = build_system_prompt(payload.child_context)
    llm_text = call_llm(payload.message, system_prompt)
    if llm_text:
        guarded = output_guardrail(llm_text)
        source = "llm" if guarded["safe"] else "guardrail"
        record_chat_usage(db, identity, len(payload.message), provider, source)
        return schemas.ChatResponse(
            reply=guarded["reply"],
            source=source,
            safety_level=guarded["safety_level"],
            suggested_actions=["Konsultasikan ke Posyandu/Puskesmas bila hasil skrining berisiko"],
        )

    fallback, actions = rule_based_reply(payload.message, payload.child_context)
    record_chat_usage(db, identity, len(payload.message), provider, "rule-based")
    return schemas.ChatResponse(
        reply=fallback,
        source="rule-based",
        safety_level="safe",
        suggested_actions=actions,
    )
