from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.dependencies import get_current_user, get_db, require_admin
from app.models.user import User
from app.schemas.user import UserCreate, UserOut
from app.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_current_user_profile(user: User = Depends(get_current_user)) -> User:
    """
    Retrieve the current authenticated user's profile.

    Available to all authenticated users.
    """
    return user


@router.get("", response_model=list[UserOut], dependencies=[Depends(require_admin)])
def list_users(db: DBSession = Depends(get_db)) -> list[User]:
    """
    List all users in the system.

    Admin only.
    """
    return db.query(User).all()


@router.post("", response_model=UserOut, status_code=201, dependencies=[Depends(require_admin)])
def create_user(payload: UserCreate, db: DBSession = Depends(get_db)) -> User:
    """
    Create a new user account.

    Only Admins can create accounts. This is the only way for users
    to gain access to the system.

    Admin only.
    """
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(
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
