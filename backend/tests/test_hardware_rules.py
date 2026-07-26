"""Tests for hardware management business logic guards."""

from datetime import date, timedelta

import pytest
from sqlalchemy.orm import Session

from app.exceptions import BusinessRuleError
from app.models.hardware import Hardware, HardwareStatus
from app.models.rental import Rental
from app.models.user import User
from app.services import hardware_service
from app.services.rental_service import rent_hardware
from app.schemas.hardware import HardwareCreate, HardwareUpdate


class TestCreateHardware:
    """Test create_hardware guards."""

    def test_cannot_create_hardware_with_future_purchase_date(
        self,
        test_db: Session,
    ):
        """CRITICAL: Purchase date cannot be in the future."""
        future_date = date.today() + timedelta(days=1)
        data = HardwareCreate(
            name="Future Laptop",
            brand="Dell",
            purchase_date=future_date,
            status=HardwareStatus.AVAILABLE,
        )

        with pytest.raises(BusinessRuleError) as exc_info:
            hardware_service.create_hardware(test_db, data)

        assert "future" in str(exc_info.value).lower()

    def test_can_create_hardware_with_past_purchase_date(
        self,
        test_db: Session,
    ):
        """Past purchase date is allowed."""
        past_date = date(2023, 1, 1)
        data = HardwareCreate(
            name="Old Laptop",
            brand="Dell",
            purchase_date=past_date,
            status=HardwareStatus.AVAILABLE,
        )

        hardware = hardware_service.create_hardware(test_db, data)

        assert hardware.purchase_date == past_date


class TestUpdateHardware:
    """Test update_hardware guards."""

    def test_cannot_update_hardware_while_rented(
        self,
        test_db: Session,
        test_user: User,
        test_hardware_available: Hardware,
    ):
        """CRITICAL: Cannot edit hardware that is actively rented."""
        rent_hardware(test_db, test_hardware_available.id, test_user)

        update = HardwareUpdate(name="Changed Name")

        with pytest.raises(BusinessRuleError) as exc_info:
            hardware_service.update_hardware(test_db, test_hardware_available.id, update)

        assert "currently rented" in str(exc_info.value).lower()

    def test_cannot_set_future_purchase_date_on_update(
        self,
        test_db: Session,
        test_hardware_available: Hardware,
    ):
        """Future purchase date is rejected on edit."""
        future_date = date.today() + timedelta(days=7)
        update = HardwareUpdate(purchase_date=future_date)

        with pytest.raises(BusinessRuleError) as exc_info:
            hardware_service.update_hardware(test_db, test_hardware_available.id, update)

        assert "future" in str(exc_info.value).lower()


class TestDeleteHardware:
    """Test delete_hardware guards."""

    def test_cannot_delete_hardware_while_rented(
        self,
        test_db: Session,
        test_user: User,
        test_hardware_available: Hardware,
    ):
        """CRITICAL: Cannot delete hardware that is actively rented."""
        rent_hardware(test_db, test_hardware_available.id, test_user)

        with pytest.raises(BusinessRuleError) as exc_info:
            hardware_service.delete_hardware(test_db, test_hardware_available.id)

        assert "currently rented" in str(exc_info.value).lower()

    def test_can_delete_hardware_with_no_rental_history(
        self,
        test_db: Session,
        test_hardware_available: Hardware,
    ):
        """Hardware that was never rented can be deleted."""
        hardware_service.delete_hardware(test_db, test_hardware_available.id)

        assert test_db.query(Hardware).filter(Hardware.id == test_hardware_available.id).first() is None
