class AppError(Exception):
    """Base class for application/service-level errors."""


class NotFoundError(AppError):
    """Raised when a requested resource does not exist."""


class BusinessRuleError(AppError):
    """Raised when a business rule is violated (e.g. invalid rental)."""


class AuthError(AppError):
    """Raised for authentication failures (invalid credentials, etc.)."""
