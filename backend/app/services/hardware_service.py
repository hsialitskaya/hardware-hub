from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session as DBSession

from app.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.models.hardware import Hardware, HardwareStatus
from app.schemas.hardware import HardwareCreate, HardwareUpdate

DEFAULT_PAGE_SIZE = 10


def list_hardware(
    db: DBSession,
    status: HardwareStatus | None = None,
    brand: str | None = None,
    sort_by: str | None = None,
    sort_direction: str | None = None,
    page: int = 1,
    page_size: int = DEFAULT_PAGE_SIZE,
) -> tuple[list[Hardware], int]:
    query = db.query(Hardware)
    if status is not None:
        query = query.filter(Hardware.status == status)
    if brand:
        query = query.filter(Hardware.brand.ilike(f"%{brand}%"))
    if sort_by in {"name", "brand", "serial_number", "purchase_date", "status"}:
        column = getattr(Hardware, sort_by)
        if sort_direction == "desc":
            query = query.order_by(column.desc())
        else:
            query = query.order_by(column.asc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def get_hardware_or_404(db: DBSession, hardware_id: int) -> Hardware:
    hardware = db.query(Hardware).filter(Hardware.id == hardware_id).first()
    if hardware is None:
        raise NotFoundError(f"Hardware {hardware_id} not found")
    return hardware


def _check_serial_number_conflict(
    db: DBSession, serial_number: str | None, exclude_id: int | None = None
) -> None:
    if not serial_number:
        return
    query = db.query(Hardware).filter(
        func.lower(Hardware.serial_number) == serial_number.lower()
    )
    if exclude_id is not None:
        query = query.filter(Hardware.id != exclude_id)
    if query.first() is not None:
        raise ConflictError(
            f"Hardware with serial number '{serial_number}' already exists."
        )


def _validate_purchase_date(purchase_date: date | None) -> None:
    """Purchase date cannot be in the future."""
    if purchase_date is not None and purchase_date > date.today():
        raise BusinessRuleError("Purchase date cannot be in the future.")


def _check_active_rental(hardware: Hardware, action: str) -> None:
    """Some operations are not allowed while the device is actively rented."""
    active_rental = next(
        (rental for rental in hardware.rentals if rental.returned_at is None), None
    )
    if active_rental is not None:
        raise BusinessRuleError(
            f"Cannot {action} hardware while it is currently rented. "
            "Wait for the user to return it first."
        )


def create_hardware(db: DBSession, data: HardwareCreate) -> Hardware:
    _check_serial_number_conflict(db, data.serial_number)
    _validate_purchase_date(data.purchase_date)
    hardware = Hardware(**data.model_dump())
    db.add(hardware)
    db.commit()
    db.refresh(hardware)
    return hardware


def update_hardware(db: DBSession, hardware_id: int, data: HardwareUpdate) -> Hardware:
    hardware = get_hardware_or_404(db, hardware_id)
    _check_serial_number_conflict(db, data.serial_number, exclude_id=hardware_id)
    _validate_purchase_date(data.purchase_date)

    # Admin can edit details of rented hardware, but cannot change its status
    # until it is returned. This keeps the rental assignment consistent.
    new_status = data.status
    if (
        new_status is not None
        and new_status != hardware.status
        and hardware.status == HardwareStatus.IN_USE
    ):
        raise BusinessRuleError(
            "Cannot change device status while it is currently rented. "
            "Wait for the user to return it first."
        )

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(hardware, field, value)
    db.commit()
    db.refresh(hardware)
    return hardware


def delete_hardware(db: DBSession, hardware_id: int) -> None:
    hardware = get_hardware_or_404(db, hardware_id)
    _check_active_rental(hardware, "delete")
    db.delete(hardware)
    db.commit()
