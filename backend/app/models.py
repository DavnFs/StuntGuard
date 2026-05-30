from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Child(Base):
    __tablename__ = "children"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, index=True)
    gender = Column(String(10), nullable=False, index=True)
    birth_date = Column(Date, nullable=False)
    parent_name = Column(String(120), nullable=True)
    address = Column(Text, nullable=True)
    posyandu_area = Column(String(120), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    measurements = relationship(
        "Measurement",
        back_populates="child",
        cascade="all, delete-orphan",
        order_by="Measurement.measurement_date",
    )


class Measurement(Base):
    __tablename__ = "measurements"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)
    measurement_date = Column(Date, nullable=False, index=True)
    age_month = Column(Integer, nullable=False)
    height_cm = Column(Float, nullable=False)
    weight_kg = Column(Float, nullable=True)
    predicted_status = Column(String(40), nullable=False, index=True)
    risk_level = Column(String(20), nullable=False, index=True)
    confidence = Column(Float, nullable=True)
    recommendation = Column(Text, nullable=False)
    model_mode = Column(String(40), nullable=False, default="rule-based-fallback")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    child = relationship("Child", back_populates="measurements")


class ConsultationTicket(Base):
    __tablename__ = "consultation_tickets"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)
    subject = Column(String(160), nullable=False)
    message = Column(Text, nullable=False)
    latest_measurement_id = Column(Integer, ForeignKey("measurements.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), nullable=False, default="pending", index=True)
    admin_reply = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    child = relationship("Child")
    latest_measurement = relationship("Measurement")


class ChatUsage(Base):
    __tablename__ = "chat_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(160), nullable=True, index=True)
    ip_address = Column(String(64), nullable=False, index=True)
    role = Column(String(20), nullable=False, default="guest", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    message_length = Column(Integer, nullable=False)
    provider = Column(String(40), nullable=False)
    source = Column(String(40), nullable=False)
