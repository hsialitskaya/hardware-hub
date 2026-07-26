# Testing

The project uses `pytest` for backend tests. All tests run against an in-memory SQLite database for speed and isolation.

## Running Tests

```bash
cd backend
source .venv/bin/activate
pytest
```

With coverage:

```bash
pytest --cov=app --cov-report=term-missing
```

## Critical Tests

### Rental Business Rules

Located in `backend/tests/test_rental_rules.py`.

| Test | Description |
|------|-------------|
| `test_cannot_rent_repaired_hardware` | Devices in Repair status cannot be rented. |
| `test_cannot_rent_in_use_hardware` | Devices already In Use cannot be rented again. |
| `test_cannot_rent_same_hardware_twice` | Prevents double rental of the same device. |
| `test_returning_hardware_restores_available_status` | Returning a device changes status back to Available. |
| `test_cannot_return_other_users_rental` | Users can only return their own rentals. |
| `test_cannot_return_already_returned_rental` | Prevents duplicate returns. |

### User Management Guards

Located in `backend/tests/test_users.py`.

| Test | Description |
|------|-------------|
| `test_cannot_delete_user_with_active_rentals` | Users with active rentals cannot be deleted. |
| `test_can_delete_user_after_returning_all_rentals` | Deletion succeeds once all rentals are returned. |
| `test_cannot_delete_self` | Admins cannot delete their own account. |
| `test_cannot_delete_nonexistent_user` | Deleting a missing user returns a clear error. |

## Adding New Tests

1. Create a file in `backend/tests/` with the prefix `test_`.
2. Use existing fixtures from `conftest.py` for database sessions, users, and hardware.
3. Test services directly when possible to avoid FastAPI request lifecycle issues.
4. Keep tests independent and fast.
