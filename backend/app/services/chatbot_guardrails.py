from __future__ import annotations

from typing import Any, Dict, Optional

from app import schemas
from app.ml.predict import DISCLAIMER


EDUCATION_NOTE = "Informasi ini bersifat edukasi dan tidak menggantikan konsultasi langsung dengan tenaga kesehatan."

ALLOWED_KEYWORDS = [
    "stunting",
    "gizi",
    "balita",
    "anak",
    "bayi",
    "posyandu",
    "puskesmas",
    "tumbuh",
    "pertumbuhan",
    "tinggi",
    "berat",
    "makan",
    "makanan",
    "mpasi",
    "asi",
    "imunisasi",
    "skrining",
    "stuntguard",
    "normal",
    "tall",
    "stunted",
    "severely",
    "pendek",
    "risiko",
    "konsultasi",
    "dokter",
    "bidan",
]

OUT_OF_SCOPE_KEYWORDS = [
    "coding",
    "programming",
    "politik",
    "investasi",
    "saham",
    "crypto",
    "game",
    "film",
    "musik",
    "judi",
    "pinjaman",
]

DIAGNOSIS_KEYWORDS = [
    "pasti stunting",
    "apakah anak saya pasti",
    "diagnosis",
    "diagnosa",
    "penyakit apa",
    "apakah ini berbahaya",
    "anak saya sakit apa",
]

MEDICATION_KEYWORDS = [
    "dosis",
    "obat",
    "antibiotik",
    "vitamin berapa",
    "berapa vitamin",
    "suplemen apa",
    "suplemen berapa",
    "takaran vitamin",
    "takaran obat",
]

EMERGENCY_KEYWORDS = [
    "sesak",
    "kejang",
    "lemas sekali",
    "tidak sadar",
    "dehidrasi",
    "diare parah",
    "diare berat",
    "demam tinggi",
    "muntah terus",
    "tidak mau minum",
    "biru",
    "pingsan",
]

UNSAFE_OUTPUT_PATTERNS = [
    "pasti stunting",
    "tidak perlu ke dokter",
    "berikan obat",
    "dosis",
    "sembuhkan",
    "jaminan",
    "diagnosis",
    "diagnosa",
]


def _contains_any(text: str, keywords: list[str]) -> bool:
    return any(keyword in text for keyword in keywords)


def classify_message(message: str) -> Dict[str, Any]:
    normalized = message.strip().lower()
    allowed = _contains_any(normalized, ALLOWED_KEYWORDS)
    out_scope_keyword = _contains_any(normalized, OUT_OF_SCOPE_KEYWORDS)

    return {
        "out_of_scope": out_scope_keyword or (not allowed and len(normalized.split()) > 2),
        "medical_diagnosis_request": _contains_any(normalized, DIAGNOSIS_KEYWORDS),
        "medication_or_dosage_request": _contains_any(normalized, MEDICATION_KEYWORDS),
        "emergency_or_danger_sign": _contains_any(normalized, EMERGENCY_KEYWORDS),
        "nutrition_question": _contains_any(normalized, ["gizi", "makanan", "makan", "mpasi", "asi", "protein"]),
        "stunting_question": _contains_any(normalized, ["stunting", "stunted", "severely", "pendek"]),
        "app_help_question": _contains_any(normalized, ["stuntguard", "skrining", "hasil", "prediksi", "risk level"]),
    }


def input_guardrail_reply(classification: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if classification["emergency_or_danger_sign"]:
        return {
            "reply": (
                "Jika anak mengalami tanda bahaya seperti sesak, kejang, lemas sekali, tidak sadar, "
                "muntah terus, diare berat, atau tidak mau minum, segera bawa ke fasilitas kesehatan terdekat.\n\n"
                f"{EDUCATION_NOTE}\n\n{DISCLAIMER}"
            ),
            "safety_level": "urgent",
            "suggested_actions": ["Segera ke fasilitas kesehatan terdekat", "Hubungi petugas kesehatan"],
        }

    if classification["medication_or_dosage_request"]:
        return {
            "reply": (
                "Saya tidak dapat memberikan dosis obat, vitamin, atau suplemen. Untuk penggunaan obat atau "
                "suplemen pada anak, sebaiknya konsultasikan langsung dengan dokter, bidan, atau petugas Puskesmas.\n\n"
                f"{EDUCATION_NOTE}\n\n{DISCLAIMER}"
            ),
            "safety_level": "blocked",
            "suggested_actions": ["Konsultasikan obat/suplemen ke dokter, bidan, atau Puskesmas"],
        }

    if classification["medical_diagnosis_request"]:
        return {
            "reply": (
                "Saya tidak dapat memberikan diagnosis medis. Saya bisa membantu menjelaskan hasil skrining "
                "dan langkah umum yang dapat dilakukan, tetapi diagnosis harus dilakukan oleh tenaga kesehatan.\n\n"
                f"{EDUCATION_NOTE}\n\n{DISCLAIMER}"
            ),
            "safety_level": "blocked",
            "suggested_actions": ["Bawa hasil skrining ke Posyandu atau Puskesmas"],
        }

    if classification["out_of_scope"]:
        return {
            "reply": (
                "Maaf, saya hanya dapat membantu pertanyaan seputar stunting, gizi balita, tumbuh kembang anak, "
                "dan penggunaan StuntGuard.\n\n"
                f"{EDUCATION_NOTE}"
            ),
            "safety_level": "blocked",
            "suggested_actions": ["Tanyakan tentang stunting, gizi balita, atau hasil skrining StuntGuard"],
        }

    return None


def format_child_context(context: Optional[schemas.ChatChildContext]) -> str:
    if context is None:
        return "Konteks hasil skrining anak: belum tersedia."

    gender_label = None
    if context.gender:
        gender_label = {"male": "laki-laki", "female": "perempuan"}.get(
            context.gender.lower(),
            context.gender,
        )

    rows = [
        ("Usia", f"{context.age_month} bulan" if context.age_month is not None else None),
        ("Jenis kelamin", gender_label),
        ("Tinggi badan", f"{context.height_cm} cm" if context.height_cm is not None else None),
        ("Berat badan", f"{context.weight_kg} kg" if context.weight_kg is not None else None),
        ("Hasil skrining", context.nutrition_status),
        ("Level risiko", context.risk_level),
        ("Rekomendasi sistem", context.recommendation),
    ]
    filled = [f"- {label}: {value}" for label, value in rows if value not in {None, ""}]
    if not filled:
        return "Konteks hasil skrining anak: belum tersedia."
    return "Konteks hasil skrining anak:\n" + "\n".join(filled)


def build_system_prompt(context: Optional[schemas.ChatChildContext] = None) -> str:
    return (
        "You are StuntGuard AI Assistant, a Bahasa Indonesia nutrition education assistant for parents and Posyandu users.\n"
        "Your role is to provide general education about stunting, toddler growth monitoring, nutrition, and safe next steps.\n"
        "You are not a doctor and you must not provide medical diagnosis.\n"
        "Always answer in simple Bahasa Indonesia.\n"
        "Use a calm, supportive, non-alarming tone.\n"
        "Keep answers practical and concise.\n"
        "You may suggest general local foods such as eggs, fish, chicken, tofu, tempeh, beans, vegetables, fruit, rice, porridge, and other balanced meals when age-appropriate.\n"
        "For children under 6 months, do not recommend solid foods; recommend exclusive breastfeeding unless advised otherwise by health professionals.\n"
        "For risky screening results, recommend consulting Posyandu or Puskesmas.\n"
        "Do not provide medicine dosage, supplement dosage, or treatment instructions.\n"
        "Do not say the child is definitely stunted based only on app data.\n"
        "Say 'hasil skrining menunjukkan risiko' instead of 'anak pasti stunting'.\n"
        "If information is incomplete, ask for age, gender, height, weight, and screening result.\n"
        "End important answers with a brief safety note that the information is educational and not a substitute for professional consultation.\n\n"
        f"{format_child_context(context)}"
    )


def output_guardrail(text: str) -> Dict[str, Any]:
    normalized = text.lower()
    if _contains_any(normalized, UNSAFE_OUTPUT_PATTERNS):
        return {
            "reply": (
                "Maaf, saya tidak dapat memberikan diagnosis atau instruksi pengobatan. Saya bisa membantu "
                "memberikan edukasi umum tentang stunting dan menyarankan konsultasi ke Posyandu/Puskesmas "
                "untuk pemeriksaan lanjutan.\n\n"
                f"{EDUCATION_NOTE}\n\n{DISCLAIMER}"
            ),
            "safe": False,
            "safety_level": "replaced",
        }

    reply = text.strip()
    if EDUCATION_NOTE.lower() not in reply.lower():
        reply = f"{reply}\n\n{EDUCATION_NOTE}"
    if "diagnosis medis" not in reply.lower() and "puskesmas" not in reply.lower():
        reply = f"{reply}\n\n{DISCLAIMER}"
    return {"reply": reply, "safe": True, "safety_level": "safe"}
