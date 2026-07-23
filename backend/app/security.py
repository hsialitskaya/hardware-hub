import secrets

from passlib.context import CryptContext


# Password hashing configuration.
#
# bcrypt is used because it is a secure algorithm designed
# specifically for storing passwords.
#
# Passwords are never stored as plain text.
# Example:
# "password123" -> "$2b$12$...."
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str) -> str:
    """
    Convert a plain password into a secure hash.

    The generated hash is stored in the database instead
    of the original password.

    Example:
        password123
            ↓
        bcrypt hash
    """
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """
    Verify that a provided password matches
    the stored password hash.

    Used during user login.

    Returns:
        True  - if password is correct
        False - if password is incorrect
    """
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


def generate_token() -> str:
    """
    Generate a secure random authentication token.

    MVP decision:
    Instead of implementing a full JWT authentication flow,
    the application uses simple random session tokens stored
    in the database.

    Flow:
        User logs in
            ↓
        Generate token
            ↓
        Store token in sessions table
            ↓
        Use token for authenticated requests

    Future improvement:
        Replace this approach with JWT authentication
        and refresh tokens for a production environment.
    """
    return secrets.token_urlsafe(32)