from sqlalchemy.orm import Session as DBSession

from app.exceptions import NotFoundError
from app.models.hardware import Hardware, HardwareStatus
from app.schemas.hardware import HardwareCreate, HardwareUpdate


def list_hardware(
    db: DBSession,
    status: HardwareStatus | None = None,
    brand: str | None = None,
    sort_by: str | None = None,
) -> list[Hardware]:
    query = db.query(Hardware)
    if status is not None:
        query = query.filter(Hardware.status == status)
    if brand:
        query = query.filter(Hardware.brand.ilike(f"%{brand}%"))
    if sort_by in {"name", "brand", "purchase_date", "status"}:
        query = query.order_by(getattr(Hardware, sort_by))
    return query.all()


def get_hardware_or_404(db: DBSession, hardware_id: int) -> Hardware:
    hardware = db.query(Hardware).filter(Hardware.id == hardware_id).first()
    if hardware is None:
        raise NotFoundError(f"Hardware {hardware_id} not found")
    return hardware


def create_hardware(db: DBSession, data: HardwareCreate) -> Hardware:
    hardware = Hardware(**data.model_dump())
    db.add(hardware)
    db.commit()
    db.refresh(hardware)
    return hardware


def update_hardware(db: DBSession, hardware_id: int, data: HardwareUpdate) -> Hardware:
    hardware = get_hardware_or_404(db, hardware_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(hardware, field, value)
    db.commit()
    db.refresh(hardware)
    return hardware


def delete_hardware(db: DBSession, hardware_id: int) -> None:
    hardware = get_hardware_or_404(db, hardware_id)
    db.delete(hardware)
    db.commit()
