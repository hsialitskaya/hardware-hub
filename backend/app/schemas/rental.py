from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RentalCreate(BaseModel):
    hardware_id: int


class RentalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    hardware_id: int
    user_id: int
    rented_at: datetime
    returned_at: datetime | None


class PaginatedRentalOut(BaseModel):
    items: list[RentalOut]
    total: int
    page: int
    page_size: int
