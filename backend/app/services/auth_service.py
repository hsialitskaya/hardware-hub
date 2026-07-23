from sqlalchemy.orm import Session as DBSession

from app.exceptions import AuthError
from app.models.session import Session as AuthSession
from app.models.user import User
from app.security import generate_token, verify_password


def login(db: DBSession, email: str, password: str) -> tuple[User, str]:
    user = db.query(User).filter(User.email == email).first()
    if user is None or not verify_password(password, user.hashed_password):
        raise AuthError("Invalid email or password")

    token = generate_token()
    db.add(AuthSession(token=token, user_id=user.id))
    db.commit()
    return user, token


def logout(db: DBSession, token: str) -> None:
    db.query(AuthSession).filter(AuthSession.token == token).delete()
    db.commit()
