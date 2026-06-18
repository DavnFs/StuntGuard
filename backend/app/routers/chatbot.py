from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services.authentication import AuthenticatedUser, get_optional_current_user
from app.services.chat_usage import check_chat_rate_limit, record_chat_usage, resolve_chat_identity
from app.services.chatbot_guardrails import (
    append_safety_note,
    build_system_prompt,
    classify_message,
    input_guardrail_reply,
    output_guardrail,
)
from app.services.llm_client import call_llm, configured_provider


router = APIRouter(tags=["chatbot"])


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


@router.post("/chatbot", response_model=schemas.ChatResponse)
def chatbot(
    payload: schemas.ChatRequest,
    request: Request,
    current_user: AuthenticatedUser | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    identity = resolve_chat_identity(request, current_user)
    if payload.child_id is not None and current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Silakan masuk untuk memakai konteks riwayat balita.",
        )

    child_context = (
        _context_from_latest_measurement(db, payload.child_id)
        if payload.child_id is not None
        else payload.child_context
    )
    message = payload.message.strip()
    allowed, limit_message = check_chat_rate_limit(db, identity)
    if not allowed:
        return schemas.ChatResponse(
            reply=limit_message or "Batas penggunaan chatbot sudah tercapai.",
            source="rate-limit",
            safety_level="limited",
            suggested_actions=["Gunakan fitur konsultasi ke petugas bila membutuhkan bantuan lanjutan"],
        )

    provider = configured_provider()
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

    record_chat_usage(db, identity, len(message), provider, "rule-based")
    return schemas.ChatResponse(
        reply=append_safety_note(DEFAULT_REPLY),
        source="rule-based",
        safety_level="safe",
        suggested_actions=[
            "Tanyakan usia, tinggi, berat, atau hasil skrining anak",
            "Konsultasikan hasil berisiko ke Posyandu/Puskesmas",
        ],
    )
