"""Tests for rental business logic guards.

From PLAN.md, minimum three critical tests:
- Cannot rent repaired hardware
- Cannot rent unavailable hardware
- Returning hardware restores Available status
"""

import pytest
from sqlalchemy.orm import Session

from app.exceptions import BusinessRuleError, NotFoundError
from app.models.hardware import Hardware, HardwareStatus
from app.models.rental import Rental
from app.models.user import User
from app.services import rental_service


class TestRentHardware:
    """Test the rent_hardware function."""

    def test_cannot_rent_repaired_hardware(
        self,
        test_db: Session,
        test_user: User,
        test_hardware_repair: Hardware,
    ):
        """CRITICAL: Cannot rent hardware marked as Repair."""
        with pytest.raises(BusinessRuleError) as exc_info:
            rental_service.rent_hardware(test_db, test_hardware_repair.id, test_user)

        assert "not available" in str(exc_info.value).lower()
        assert test_hardware_repair.status == HardwareStatus.REPAIR

    def test_cannot_rent_in_use_hardware(
        self,
        test_db: Session,
        test_user: User,
        test_hardware_in_use: Hardware,
    ):
        """CRITICAL: Cannot rent hardware already In Use."""
        with pytest.raises(BusinessRuleError) as exc_info:
            rental_service.rent_hardware(test_db, test_hardware_in_use.id, test_user)

        assert "not available" in str(exc_info.value).lower()
        assert test_hardware_in_use.status == HardwareStatus.IN_USE

    def test_cannot_rent_nonexistent_hardware(
        self,
        test_db: Session,
        test_user: User,
    ):
        """Cannot rent a hardware item that doesn't exist."""
        with pytest.raises(NotFoundError):
            rental_service.rent_hardware(test_db, 9999, test_user)

    def test_can_rent_available_hardware(
        self,
        test_db: Session,
        test_user: User,
        test_hardware_available: Hardware,
    ):
        """User can successfully rent available hardware."""
        rental = rental_service.rent_hardware(
            test_db,
            test_hardware_available.id,
            test_user,
        )

        assert rental.user_id == test_user.id
        assert rental.hardware_id == test_hardware_available.id
        assert rental.returned_at is None
        assert rental.rented_at is not None

        test_db.refresh(test_hardware_available)
        assert test_hardware_available.status == HardwareStatus.IN_USE

    def test_cannot_rent_same_hardware_twice(
        self,
        test_db: Session,
        test_user: User,
        test_hardware_available: Hardware,
    ):
        """Once hardware is rented, it becomes unavailable for others."""
        rental1 = rental_service.rent_hardware(
            test_db,
            test_hardware_available.id,
            test_user,
        )
        assert rental1 is not None

        test_db.refresh(test_hardware_available)
        with pytest.raises(BusinessRuleError) as exc_info:
            rental_service.rent_hardware(
                test_db,
                test_hardware_available.id,
                test_user,
            )

        assert "not available" in str(exc_info.value).lower()


class TestReturnHardware:
    """Test the return_hardware function."""

    def test_returning_hardware_restores_available_status(
        self,
        test_db: Session,
        test_user: User,
        test_hardware_available: Hardware,
    ):
        """CRITICAL: Returning hardware restores Available status."""
        rental = rental_service.rent_hardware(
            test_db,
            test_hardware_available.id,
            test_user,
        )

        test_db.refresh(test_hardware_available)
        assert test_hardware_available.status == HardwareStatus.IN_USE

        returned = rental_service.return_hardware(test_db, rental.id, test_user)

        assert returned.returned_at is not None
        test_db.refresh(test_hardware_available)
        assert test_hardware_available.status == HardwareStatus.AVAILABLE

    def test_cannot_return_nonexistent_rental(
        self,
        test_db: Session,
        test_user: User,
    ):
        """Cannot return a rental that doesn't exist."""
        with pytest.raises(NotFoundError):
            rental_service.return_hardware(test_db, 9999, test_user)

    def test_cannot_return_other_users_rental(
        self,
        test_db: Session,
        test_user: User,
        test_admin: User,
        test_hardware_available: Hardware,
    ):
        """User cannot return hardware rented by someone else."""
        rental = rental_service.rent_hardware(
            test_db,
            test_hardware_available.id,
            test_user,
        )

        with pytest.raises(BusinessRuleError) as exc_info:
            rental_service.return_hardware(test_db, rental.id, test_admin)

        assert "rented yourself" in str(exc_info.value).lower()

    def test_cannot_return_already_returned_rental(
        self,
        test_db: Session,
        test_user: User,
        test_hardware_available: Hardware,
    ):
        """Cannot return the same rental twice."""
        rental = rental_service.rent_hardware(
            test_db,
            test_hardware_available.id,
            test_user,
        )

        rental_service.return_hardware(test_db, rental.id, test_user)

        with pytest.raises(BusinessRuleError) as exc_info:
            rental_service.return_hardware(test_db, rental.id, test_user)

        assert "already returned" in str(exc_info.value).lower()

    def test_user_can_see_rental_history(
        self,
        test_db: Session,
        test_user: User,
        test_hardware_available: Hardware,
    ):
        """User can retrieve their rental history."""
        rental = rental_service.rent_hardware(
            test_db,
            test_hardware_available.id,
            test_user,
        )
        rental_service.return_hardware(test_db, rental.id, test_user)

        rentals = rental_service.list_my_rentals(test_db, test_user)

        assert len(rentals) == 1
        assert rentals[0].id == rental.id
        assert rentals[0].returned_at is not None
