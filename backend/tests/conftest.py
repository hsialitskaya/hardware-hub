"""Pytest configuration and shared fixtures."""

import os
from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database import Base
from app.models.hardware import Hardware, HardwareStatus
from app.models.user import User, UserRole
from app.security import hash_password


@pytest.fixture
def test_db():
    """Create an in-memory SQLite database for testing."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    db = SessionLocal()
    yield db
    db.close()


@pytest.fixture
def test_user(test_db: Session) -> User:
    """Create a regular test user."""
    user = User(
        email="user@booksy.com",
        hashed_password=hash_password("test123"),
        role=UserRole.USER,
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture
def test_admin(test_db: Session) -> User:
    """Create an admin test user."""
    admin = User(
        email="admin@booksy.com",
        hashed_password=hash_password("admin123"),
        role=UserRole.ADMIN,
    )
    test_db.add(admin)
    test_db.commit()
    test_db.refresh(admin)
    return admin


@pytest.fixture
def test_hardware_available(test_db: Session) -> Hardware:
    """Create an available hardware item."""
    hw = Hardware(
        name="Test Laptop",
        brand="Dell",
        purchase_date=date(2023, 1, 1),
        status=HardwareStatus.AVAILABLE,
        notes="Available for rent",
    )
    test_db.add(hw)
    test_db.commit()
    test_db.refresh(hw)
    return hw


@pytest.fixture
def test_hardware_in_use(test_db: Session) -> Hardware:
    """Create a hardware item that is already in use."""
    hw = Hardware(
        name="Busy Laptop",
        brand="Apple",
        purchase_date=date(2023, 6, 1),
        status=HardwareStatus.IN_USE,
        notes="Already rented",
    )
    test_db.add(hw)
    test_db.commit()
    test_db.refresh(hw)
    return hw


@pytest.fixture
def test_hardware_repair(test_db: Session) -> Hardware:
    """Create a hardware item in repair status."""
    hw = Hardware(
        name="Broken Phone",
        brand="Samsung",
        purchase_date=date(2022, 6, 1),
        status=HardwareStatus.REPAIR,
        notes="Screen cracked",
    )
    test_db.add(hw)
    test_db.commit()
    test_db.refresh(hw)
    return hw
