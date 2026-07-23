from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.hardware import Hardware
    from app.models.user import User


class Rental(Base):
    """A rental record. An active rental has `returned_at is None`.

    This single table doubles as both the "current assignment" state and
    the historical log, so there is no separate assignment table.
    """

    __tablename__ = "rentals"

    id: Mapped[int] = mapped_column(primary_key=True)
    hardware_id: Mapped[int] = mapped_column(ForeignKey("hardware.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    rented_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    returned_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    hardware: Mapped["Hardware"] = relationship(back_populates="rentals")
    user: Mapped["User"] = relationship(back_populates="rentals")
