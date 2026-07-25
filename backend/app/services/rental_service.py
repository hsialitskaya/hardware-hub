from datetime import datetime, timezone

from sqlalchemy.orm import Session as DBSession

from app.exceptions import BusinessRuleError, NotFoundError
from app.models.hardware import Hardware, HardwareStatus
from app.models.rental import Rental
from app.models.user import User


def rent_hardware(db: DBSession, hardware_id: int, user: User) -> Rental:
    hardware = db.query(Hardware).filter(Hardware.id == hardware_id).first()
    if hardware is None:
        raise NotFoundError(f"Hardware {hardware_id} not found")
    if hardware.status != HardwareStatus.AVAILABLE:
        raise BusinessRuleError(f"Hardware is not available (status: {hardware.status.value})")

    hardware.status = HardwareStatus.IN_USE
    rental = Rental(hardware_id=hardware.id, user_id=user.id, rented_at=datetime.now(timezone.utc))
    db.add(rental)
    db.commit()
    db.refresh(rental)
    return rental


def return_hardware(db: DBSession, rental_id: int, user: User) -> Rental:
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if rental is None:
        raise NotFoundError(f"Rental {rental_id} not found")
    if rental.user_id != user.id:
        raise BusinessRuleError("You can only return hardware you rented yourself")
    if rental.returned_at is not None:
        raise BusinessRuleError("This rental was already returned")

    rental.returned_at = datetime.now(timezone.utc)
    rental.hardware.status = HardwareStatus.AVAILABLE
    db.commit()
    db.refresh(rental)
    return rental


def list_my_rentals(
    db: DBSession,
    user: User,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[Rental], int]:
    query = (
        db.query(Rental)
        .filter(Rental.user_id == user.id)
        .order_by(Rental.rented_at.desc())
    )
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total
