from sqlalchemy.orm import Session as DBSession

from app.exceptions import BusinessRuleError
from app.models.user import User, UserRole
from app.schemas.user import UserCreate
from app.security import hash_password


DEFAULT_PAGE_SIZE = 10


def list_users(
    db: DBSession,
    page: int = 1,
    page_size: int = DEFAULT_PAGE_SIZE,
    sort_by: str | None = None,
    sort_direction: str | None = None,
) -> tuple[list[User], int]:
    """List all users, optionally sorted by a whitelisted column."""
    query = db.query(User)
    if sort_by in {"email", "role", "created_at"}:
        column = getattr(User, sort_by)
        if sort_direction == "desc":
            query = query.order_by(column.desc())
        else:
            query = query.order_by(column.asc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


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


def delete_user(db: DBSession, user_id: int, admin: User) -> None:
    """Delete a user account.

    Safeguards:
    - Cannot delete self.
    - Cannot delete the last admin user.
    - Cannot delete a user with active rentals.

    Raises:
        BusinessRuleError: if any safeguard is violated.
    """
    if admin.id == user_id:
        raise BusinessRuleError("Cannot delete your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise BusinessRuleError("User not found")

    # Defensive guard: never leave the system without an admin.
    admin_count = db.query(User).filter(User.role == UserRole.ADMIN).count()
    if user.role == UserRole.ADMIN and admin_count == 1:
        raise BusinessRuleError("Cannot delete the last admin user")

    active_rentals = [rental for rental in user.rentals if rental.returned_at is None]
    if active_rentals:
        raise BusinessRuleError(
            "Cannot delete user with active rentals. Return all hardware first."
        )

    # Delete the user's rental history before deleting the account.
    # This preserves referential integrity because rentals.user_id is NOT NULL.
    for rental in user.rentals:
        db.delete(rental)

    db.delete(user)
    db.commit()
