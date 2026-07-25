from datetime import date

from pydantic import BaseModel, ConfigDict

from app.models.hardware import HardwareStatus


class HardwareBase(BaseModel):
    name: str
    brand: str
    serial_number: str | None = None
    purchase_date: date | None = None
    status: HardwareStatus = HardwareStatus.AVAILABLE
    notes: str | None = None


class HardwareCreate(HardwareBase):
    pass


class HardwareUpdate(BaseModel):
    name: str | None = None
    brand: str | None = None
    serial_number: str | None = None
    purchase_date: date | None = None
    status: HardwareStatus | None = None
    notes: str | None = None


class HardwareOut(HardwareBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
