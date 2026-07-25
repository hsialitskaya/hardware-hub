from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session as DBSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.dependencies import get_current_user, get_db, require_admin
from app.exceptions import BusinessRuleError
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, PaginatedUserOut
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])
limiter = Limiter(key_func=get_remote_address)


@router.get("/me", response_model=UserOut)
@limiter.limit("60/minute")
def get_current_user_profile(
    request: Request,
    user: User = Depends(get_current_user),
) -> User:
    """
    Retrieve the current authenticated user's profile.

    Available to all authenticated users.
    """
    return user


@router.get("", response_model=PaginatedUserOut, dependencies=[Depends(require_admin)])
@limiter.limit("60/minute")
def list_users(
    request: Request,
    db: DBSession = Depends(get_db),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
) -> PaginatedUserOut:
    """
    List all users in the system.

    Admin only.
    """
    query = db.query(User)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedUserOut(
        items=[UserOut.model_validate(user) for user in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=UserOut, status_code=201, dependencies=[Depends(require_admin)])
@limiter.limit("20/minute")
def create_user(
    request: Request,
    payload: UserCreate,
    db: DBSession = Depends(get_db),
) -> User:
    """
    Create a new user account.

    Only Admins can create accounts. This is the only way for users
    to gain access to the system.

    Admin only.
    """
    try:
        return user_service.create_user(db, payload)
    except BusinessRuleError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.delete("/{user_id}", status_code=204)
@limiter.limit("30/minute")
def delete_user(
    request: Request,
    user_id: int,
    db: DBSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> None:
    """
    Delete a user account.

    Safeguards:
    - Cannot delete self.
    - Cannot delete the last admin user.

    Admin only.
    """
    from app.models.user import UserRole

    if admin.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    admin_count = db.query(User).filter(User.role == UserRole.ADMIN).count()
    if user.role == UserRole.ADMIN and admin_count == 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the last admin user"
        )

    db.delete(user)
    db.commit()
