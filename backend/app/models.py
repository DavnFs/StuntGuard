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
    predicted_status = Column(String(40), nullable=False, index=True)
    risk_level = Column(String(20), nullable=False, index=True)
    confidence = Column(Float, nullable=True)
    recommendation = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    child = relationship("Child", back_populates="measurements")
