from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session as DBSession

from app.dependencies import get_current_user, get_db, require_admin
from app.exceptions import NotFoundError
from app.models.hardware import HardwareStatus
from app.schemas.hardware import HardwareCreate, HardwareOut, HardwareUpdate
from app.services import hardware_service

router = APIRouter(prefix="/hardware", tags=["hardware"])


@router.get("", response_model=list[HardwareOut], dependencies=[Depends(get_current_user)])
def list_hardware(
    status_filter: HardwareStatus | None = Query(default=None, alias="status"),
    brand: str | None = None,
    sort_by: str | None = None,
    db: DBSession = Depends(get_db),
):
    return hardware_service.list_hardware(db, status=status_filter, brand=brand, sort_by=sort_by)


@router.post("", response_model=HardwareOut, status_code=201, dependencies=[Depends(require_admin)])
def create_hardware(payload: HardwareCreate, db: DBSession = Depends(get_db)):
    return hardware_service.create_hardware(db, payload)


@router.patch("/{hardware_id}", response_model=HardwareOut, dependencies=[Depends(require_admin)])
def update_hardware(hardware_id: int, payload: HardwareUpdate, db: DBSession = Depends(get_db)):
    try:
        return hardware_service.update_hardware(db, hardware_id, payload)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/{hardware_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_hardware(hardware_id: int, db: DBSession = Depends(get_db)):
    try:
        hardware_service.delete_hardware(db, hardware_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
