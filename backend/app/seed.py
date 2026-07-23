"""Seed the database with an initial admin user and sample hardware.

Run with (from backend/):
    python -m app.seed
"""

from datetime import date

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.models.hardware import Hardware, HardwareStatus
from app.models.user import User, UserRole
from app.security import hash_password

SAMPLE_HARDWARE = [
    {
        "name": "iPhone 13 Pro Max",
        "brand": "Apple",
        "purchase_date": date(2022, 3, 15),
        "status": HardwareStatus.AVAILABLE,
        "notes": "iOS testing device",
    },
    {
        "name": "Galaxy S21",
        "brand": "Samsung",
        "purchase_date": date(2021, 6, 1),
        "status": HardwareStatus.AVAILABLE,
        "notes": "Android testing device",
    },
    {
        "name": "iPad Pro 12.9",
        "brand": "Apple",
        "purchase_date": date(2023, 1, 10),
        "status": HardwareStatus.AVAILABLE,
        "notes": "Tablet testing",
    },
    {
        "name": "Pixel 7",
        "brand": "Google",
        "purchase_date": date(2022, 11, 5),
        "status": HardwareStatus.REPAIR,
        "notes": "Screen cracked, currently in repair",
    },
    {
        "name": "ThinkPad X1 Carbon",
        "brand": "Lenovo",
        "purchase_date": date(2021, 9, 20),
        "status": HardwareStatus.AVAILABLE,
        "notes": "General purpose laptop",
    },
]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    settings = get_settings()
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == settings.admin_email).first() is None:
            db.add(
                User(
                    email=settings.admin_email,
                    hashed_password=hash_password(settings.admin_password),
                    role=UserRole.ADMIN,
                )
            )

        if db.query(Hardware).count() == 0:
            db.add_all(Hardware(**item) for item in SAMPLE_HARDWARE)

        db.commit()
        print(f"Seed complete. Admin login: {settings.admin_email} / {settings.admin_password}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
