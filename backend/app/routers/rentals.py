from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session as DBSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.dependencies import get_current_user, get_db
from app.exceptions import BusinessRuleError, NotFoundError
from app.models.user import User
from app.schemas.rental import RentalCreate, RentalOut, PaginatedRentalOut
from app.services import rental_service

router = APIRouter(prefix="/rentals", tags=["rentals"])
limiter = Limiter(key_func=get_remote_address)


@router.post("", response_model=RentalOut, status_code=201)
@limiter.limit("30/minute")
def rent_hardware(
    request: Request,
    payload: RentalCreate,
    db: DBSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return rental_service.rent_hardware(db, payload.hardware_id, user)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except BusinessRuleError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{rental_id}/return", response_model=RentalOut)
@limiter.limit("30/minute")
def return_hardware(
    request: Request,
    rental_id: int,
    db: DBSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return rental_service.return_hardware(db, rental_id, user)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except BusinessRuleError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/me", response_model=PaginatedRentalOut)
@limiter.limit("60/minute")
def my_rentals(
    request: Request,
    db: DBSession = Depends(get_db),
    user: User = Depends(get_current_user),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
):
    items, total = rental_service.list_my_rentals(db, user, page=page, page_size=page_size)
    return PaginatedRentalOut(
        items=[RentalOut.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )
