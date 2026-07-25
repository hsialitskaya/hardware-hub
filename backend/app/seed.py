"""Seed the database with an initial admin user and sample hardware.

Run with (from backend/), after applying migrations:
    alembic upgrade head
    python -m app.seed
"""

from datetime import date

from app.config import get_settings
from app.database import SessionLocal
from app.models.hardware import Hardware, HardwareStatus
from app.models.user import User, UserRole
from app.security import hash_password

SAMPLE_HARDWARE = [
    {
        "name": 'MacBook Pro 16"',
        "brand": "Apple",
        "serial_number": "MBP-2024-001",
        "purchase_date": date(2026, 1, 15),
        "status": HardwareStatus.AVAILABLE,
        "notes": "iOS/macOS testing laptop",
    },
    {
        "name": "Dell XPS 15",
        "brand": "Dell",
        "serial_number": "DELL-XPS-002",
        "purchase_date": date(2026, 1, 20),
        "status": HardwareStatus.IN_USE,
        "notes": "Windows development laptop",
    },
    {
        "name": "iPhone 15 Pro",
        "brand": "Apple",
        "serial_number": "IPH-15-003",
        "purchase_date": date(2026, 2, 1),
        "status": HardwareStatus.AVAILABLE,
        "notes": "iOS testing device",
    },
    {
        "name": "iPad Air",
        "brand": "Apple",
        "serial_number": "IPAD-AIR-004",
        "purchase_date": date(2026, 2, 5),
        "status": HardwareStatus.REPAIR,
        "notes": "Screen cracked, currently in repair",
    },
    {
        "name": "ThinkPad X1 Carbon",
        "brand": "Lenovo",
        "serial_number": "TPX1-005",
        "purchase_date": date(2026, 2, 10),
        "status": HardwareStatus.AVAILABLE,
        "notes": "General purpose laptop",
    },
    {
        "name": "Surface Pro 9",
        "brand": "Microsoft",
        "serial_number": "SRF-PRO-006",
        "purchase_date": date(2026, 2, 12),
        "status": HardwareStatus.IN_USE,
        "notes": "Hybrid Windows device",
    },
    {
        "name": "Magic Keyboard",
        "brand": "Apple",
        "serial_number": "MKB-007",
        "purchase_date": date(2026, 2, 15),
        "status": HardwareStatus.AVAILABLE,
        "notes": "External keyboard",
    },
    {
        "name": 'Dell Monitor 27"',
        "brand": "Dell",
        "serial_number": "DELL-MON-008",
        "purchase_date": date(2026, 2, 18),
        "status": HardwareStatus.AVAILABLE,
        "notes": "External monitor",
    },
]


def seed() -> None:
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
