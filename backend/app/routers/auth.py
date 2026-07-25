from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session as DBSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.dependencies import get_current_token, get_db
from app.exceptions import AuthError
from app.schemas.auth import LoginRequest, TokenResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest, db: DBSession = Depends(get_db)) -> TokenResponse:
    try:
        user, token = auth_service.login(db, payload.email, payload.password)
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    return TokenResponse(access_token=token, user=user)


@router.post("/logout", status_code=204)
@limiter.limit("30/minute")
def logout(
    request: Request,
    db: DBSession = Depends(get_db),
    token: str = Depends(get_current_token),
) -> None:
    """
    Revoke the current session by deleting its token from the database.

    After logout, the client must discard the token and cannot use it
    for future requests.
    """
    auth_service.logout(db, token)
