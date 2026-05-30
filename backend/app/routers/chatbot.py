from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services.chat_usage import check_chat_rate_limit, record_chat_usage, resolve_chat_identity
from app.services.chatbot_guardrails import (
    IMMEDIATE_NEXT_STEP_KEYWORDS,
    append_safety_note,
    build_system_prompt,
    classify_message,
    input_guardrail_reply,
    output_guardrail,
)
from app.services.llm_client import call_llm, configured_provider


router = APIRouter(tags=["chatbot"])


RULES = [
    (
        IMMEDIATE_NEXT_STEP_KEYWORDS,
        (
            "Untuk langkah awal sebelum ke Posyandu atau Puskesmas, orang tua dapat melakukan hal aman berikut:\n\n"
            "1. Pastikan anak tetap makan dan minum cukup sesuai usianya.\n"
            "2. Berikan makanan bergizi seimbang. Untuk anak di atas 6 bulan, utamakan sumber protein seperti telur, ikan, ayam, tahu, atau tempe, ditambah makanan pokok, sayur, dan buah.\n"
            "3. Catat tinggi badan, berat badan, pola makan, keluhan, dan hasil skrining StuntGuard untuk ditunjukkan ke petugas kesehatan.\n"
            "4. Jangan memberikan obat, vitamin, atau suplemen tanpa arahan dokter, bidan, ahli gizi, atau petugas Puskesmas.\n\n"
            "Jika anak tampak sangat lemas, tidak mau minum, muntah terus, diare berat, demam tinggi, sesak, atau kejang, segera bawa ke fasilitas kesehatan terdekat."
        ),
        [
            "Catat tinggi, berat, pola makan, dan keluhan anak",
            "Siapkan hasil skrining untuk dibawa ke Posyandu/Puskesmas",
            "Jangan memberi obat atau suplemen tanpa arahan tenaga kesehatan",
        ],
    ),
    (
        [
            "dibiarkan",
            "hingga dewasa",
            "dewasa",
            "efek",
            "dampak",
            "jangka panjang",
            "bahaya",
            "bahayanya",
            "akibat",
            "pengaruh",
            "sekolah",
            "belajar",
            "otak",
            "perkembangan",
            "produktivitas",
            "masa depan",
        ],
        "Jika risiko stunting tidak ditangani, dampaknya dapat berlangsung jangka panjang, seperti hambatan pertumbuhan fisik, perkembangan belajar yang kurang optimal, daya tahan tubuh yang lebih rentan, dan produktivitas saat dewasa yang dapat menurun. Namun hasil StuntGuard adalah skrining awal, bukan diagnosis. Sebaiknya konsultasikan ke Posyandu atau Puskesmas agar anak mendapat pemeriksaan dan pendampingan yang tepat.",
        [
            "Konsultasikan hasil skrining ke Posyandu/Puskesmas",
            "Pantau tinggi dan berat badan setiap bulan",
            "Perhatikan asupan protein dan gizi seimbang sesuai usia",
        ],
    ),
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


def _context_from_latest_measurement(db: Session, child_id: int | None) -> schemas.ChatChildContext | None:
    if child_id is None:
        return None

    measurement = (
        db.query(models.Measurement)
        .filter(models.Measurement.child_id == child_id)
        .order_by(models.Measurement.measurement_date.desc(), models.Measurement.id.desc())
        .first()
    )
    if not measurement:
        return None

    return schemas.ChatChildContext(
        age_month=measurement.age_month,
        height_cm=measurement.height_cm,
        weight_kg=measurement.weight_kg,
        nutrition_status=measurement.predicted_status,
        risk_level=measurement.risk_level,
        recommendation=measurement.recommendation,
    )


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
            return append_safety_note(f"{reply}{contextual_note}"), actions

    return append_safety_note(DEFAULT_REPLY), [
        "Tanyakan usia, tinggi, berat, atau hasil skrining anak",
        "Konsultasikan hasil berisiko ke Posyandu/Puskesmas",
    ]


@router.post("/chatbot", response_model=schemas.ChatResponse)
def chatbot(payload: schemas.ChatRequest, request: Request, db: Session = Depends(get_db)):
    identity = resolve_chat_identity(request)
    provider = configured_provider()
    child_context = payload.child_context or _context_from_latest_measurement(db, payload.child_id)
    message = payload.message.strip()

    if not message:
        return schemas.ChatResponse(
            reply="Silakan tulis pertanyaan terlebih dahulu.",
            source="validation",
            safety_level="safe",
            suggested_actions=["Tanyakan tentang stunting, gizi balita, atau hasil skrining"],
        )

    if len(message) > 500:
        return schemas.ChatResponse(
            reply="Pertanyaan terlalu panjang. Mohon ringkas menjadi maksimal 500 karakter agar mudah dijawab.",
            source="validation",
            safety_level="limited",
            suggested_actions=["Ringkas pertanyaan menjadi lebih singkat"],
        )

    classification = classify_message(message, child_context)
    blocked = input_guardrail_reply(classification)
    if blocked:
        record_chat_usage(db, identity, len(message), provider, "guardrail")
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

    system_prompt = build_system_prompt(child_context)
    llm_text = call_llm(message, system_prompt)
    if llm_text:
        guarded = output_guardrail(llm_text)
        source = "llm" if guarded["safe"] else "guardrail"
        record_chat_usage(db, identity, len(message), provider, source)
        return schemas.ChatResponse(
            reply=append_safety_note(guarded["reply"]),
            source=source,
            safety_level=guarded["safety_level"],
            suggested_actions=["Konsultasikan ke Posyandu/Puskesmas bila hasil skrining berisiko"],
        )

    fallback, actions = rule_based_reply(message, child_context)
    record_chat_usage(db, identity, len(message), provider, "rule-based")
    return schemas.ChatResponse(
        reply=fallback,
        source="rule-based",
        safety_level="safe",
        suggested_actions=actions,
    )
