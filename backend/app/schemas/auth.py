from pydantic import BaseModel, field_validator

from app.schemas.user import UserOut, COMPANY_DOMAIN


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_company_email(cls, value: str) -> str:
        if not value.lower().endswith(COMPANY_DOMAIN):
            raise ValueError(f"Only company emails ending with {COMPANY_DOMAIN} are allowed.")
        return value


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
