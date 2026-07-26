"""Tests for user management business rules."""

import pytest
from sqlalchemy.orm import Session

from app.exceptions import BusinessRuleError
from app.models.hardware import Hardware
from app.models.user import User
from app.services import rental_service, user_service


class TestDeleteUser:
    """Test the delete_user service function."""

    def test_cannot_delete_user_with_active_rentals(
        self,
        test_db: Session,
        test_admin: User,
        test_user: User,
        test_hardware_available: Hardware,
    ):
        """A user with active rentals cannot be deleted."""
        rental_service.rent_hardware(test_db, test_hardware_available.id, test_user)

        with pytest.raises(BusinessRuleError) as exc_info:
            user_service.delete_user(test_db, test_user.id, test_admin)

        assert "active rentals" in str(exc_info.value).lower()

    def test_can_delete_user_after_returning_all_rentals(
        self,
        test_db: Session,
        test_admin: User,
        test_user: User,
        test_hardware_available: Hardware,
    ):
        """A user can be deleted after all rentals are returned."""
        rental = rental_service.rent_hardware(
            test_db, test_hardware_available.id, test_user
        )
        rental_service.return_hardware(test_db, rental.id, test_user)

        user_service.delete_user(test_db, test_user.id, test_admin)

        deleted_user = test_db.query(User).filter(User.id == test_user.id).first()
        assert deleted_user is None

    def test_cannot_delete_self(
        self,
        test_db: Session,
        test_admin: User,
    ):
        """An admin cannot delete their own account."""
        with pytest.raises(BusinessRuleError) as exc_info:
            user_service.delete_user(test_db, test_admin.id, test_admin)

        assert "own account" in str(exc_info.value).lower()

    def test_cannot_delete_nonexistent_user(
        self,
        test_db: Session,
        test_admin: User,
    ):
        """Deleting a missing user raises a clear error."""
        with pytest.raises(BusinessRuleError) as exc_info:
            user_service.delete_user(test_db, 9999, test_admin)

        assert "not found" in str(exc_info.value).lower()
