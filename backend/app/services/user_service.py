from sqlalchemy.orm import Session as DBSession

from app.exceptions import BusinessRuleError
from app.models.user import User
from app.schemas.user import UserCreate
from app.security import hash_password


def create_user(db: DBSession, payload: UserCreate) -> User:
    """Create a new user account.

    Only admins can create accounts. This is the only way for users
    to gain access to the system.

    Raises:
        BusinessRuleError: if the email is already registered.
    """
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        raise BusinessRuleError("Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
