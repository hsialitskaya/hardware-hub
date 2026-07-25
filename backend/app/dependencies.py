from collections.abc import Generator

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.database import SessionLocal
from app.models.session import Session as AuthSession
from app.models.user import User, UserRole


def get_db() -> Generator[DBSession, None, None]:
    """
    Provide a database session for API requests.

    The session is created when the request starts
    and automatically closed after the request finishes.

    Example usage:

        def get_hardware(db: DBSession = Depends(get_db)):
            ...

    This prevents leaving unused database connections open.
    """

    # Create a new database session
    db = SessionLocal()

    try:
        # Provide database access to the endpoint
        yield db

    finally:
        # Always close the connection after the request
        db.close()


def get_current_user(
    authorization: str | None = Header(default=None),
    db: DBSession = Depends(get_db),
) -> User:
    """
    Authenticate the current user using a Bearer token.

    Authentication flow:

        Client sends request
                |
                ↓
        Authorization: Bearer <token>
                |
                ↓
        Find token in sessions table
                |
                ↓
        Return associated user

    If the token is missing or invalid,
    the request is rejected.
    """

    # Check if Authorization header exists
    # and follows the expected Bearer token format
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    # Remove "Bearer " prefix and keep only the token value
    token = authorization.removeprefix("Bearer ").strip()

    # Find active session with this token
    session = (
        db.query(AuthSession)
        .filter(AuthSession.token == token)
        .first()
    )

    # Token does not exist or session expired
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    # Find user connected to this session
    user = (
        db.query(User)
        .filter(User.id == session.user_id)
        .first()
    )

    # User was removed from the system
    # but the session still exists
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists"
        )

    return user


def require_admin(
    user: User = Depends(get_current_user)
) -> User:
    """
    Check if the current user has administrator permissions.

    Used for protected endpoints such as:

    - creating users
    - adding hardware
    - deleting hardware
    - changing repair status

    Only users with ADMIN role can access these operations.
    """

    # Verify user role
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )

    return user


def get_current_token(
    authorization: str | None = Header(default=None),
) -> str:
    """
    Extract and return the Bearer token from the Authorization header.

    The token is validated for correct format, but not checked against
    the database. Use `get_current_user` when the user object is needed.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    return authorization.removeprefix("Bearer ").strip()