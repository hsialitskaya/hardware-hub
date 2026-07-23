from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.dependencies import get_current_user, get_db
from app.exceptions import AuthError
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: DBSession = Depends(get_db)) -> TokenResponse:
    try:
        user, token = auth_service.login(db, payload.email, payload.password)
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    return TokenResponse(access_token=token, user=user)


@router.post("/logout", status_code=204)
def logout(
    authorization: str | None = Header(default=None),
    db: DBSession = Depends(get_db),
) -> None:
    """
    Revoke the current session by deleting its token from the database.

    After logout, the client must discard the token and cannot use it
    for future requests.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    token = authorization.removeprefix("Bearer ").strip()
    auth_service.logout(db, token)
