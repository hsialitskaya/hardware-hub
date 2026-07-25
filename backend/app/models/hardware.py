from __future__ import annotations

import enum
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.rental import Rental


class HardwareStatus(str, enum.Enum):
    AVAILABLE = "available"
    IN_USE = "in_use"
    REPAIR = "repair"


class Hardware(Base):
    __tablename__ = "hardware"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    brand: Mapped[str] = mapped_column(String(255), nullable=False)
    serial_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    purchase_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[HardwareStatus] = mapped_column(
        Enum(HardwareStatus, values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        default=HardwareStatus.AVAILABLE,
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    rentals: Mapped[list["Rental"]] = relationship(back_populates="hardware")
