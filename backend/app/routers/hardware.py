from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session as DBSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.dependencies import get_current_user, get_db, require_admin
from app.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.models.hardware import HardwareStatus
from app.schemas.hardware import (
    HardwareCreate,
    HardwareOut,
    HardwareUpdate,
    PaginatedHardwareOut,
)
from app.services import hardware_service

router = APIRouter(prefix="/hardware", tags=["hardware"])
limiter = Limiter(key_func=get_remote_address)


@router.get("", response_model=PaginatedHardwareOut, dependencies=[Depends(get_current_user)])
@limiter.limit("60/minute")
def list_hardware(
    request: Request,
    status_filter: HardwareStatus | None = Query(default=None, alias="status"),
    brand: str | None = None,
    sort_by: str | None = None,
    sort_direction: str | None = Query(default=None, pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: DBSession = Depends(get_db),
):
    items, total = hardware_service.list_hardware(
        db,
        status=status_filter,
        brand=brand,
        sort_by=sort_by,
        sort_direction=sort_direction,
        page=page,
        page_size=page_size,
    )
    return PaginatedHardwareOut(
        items=[HardwareOut.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=HardwareOut, status_code=201, dependencies=[Depends(require_admin)])
@limiter.limit("30/minute")
def create_hardware(request: Request, payload: HardwareCreate, db: DBSession = Depends(get_db)):
    try:
        return hardware_service.create_hardware(db, payload)
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.patch("/{hardware_id}", response_model=HardwareOut, dependencies=[Depends(require_admin)])
@limiter.limit("30/minute")
def update_hardware(request: Request, hardware_id: int, payload: HardwareUpdate, db: DBSession = Depends(get_db)):
    try:
        return hardware_service.update_hardware(db, hardware_id, payload)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except BusinessRuleError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/{hardware_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_hardware(hardware_id: int, db: DBSession = Depends(get_db)):
    try:
        hardware_service.delete_hardware(db, hardware_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
