from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.dependencies import get_current_user, get_db
from app.exceptions import BusinessRuleError, NotFoundError
from app.models.user import User
from app.schemas.rental import RentalCreate, RentalOut
from app.services import rental_service

router = APIRouter(prefix="/rentals", tags=["rentals"])


@router.post("", response_model=RentalOut, status_code=201)
def rent_hardware(
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
def return_hardware(
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


@router.get("/me", response_model=list[RentalOut])
def my_rentals(db: DBSession = Depends(get_db), user: User = Depends(get_current_user)):
    return rental_service.list_my_rentals(db, user)
