from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.models.user import UserRole

COMPANY_DOMAIN = "@booksy.com"


class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.USER

    @field_validator("email")
    @classmethod
    def validate_company_email(cls, value: str) -> str:
        if not value.lower().endswith(COMPANY_DOMAIN):
            raise ValueError(f"Only company emails ending with {COMPANY_DOMAIN} are allowed.")
        return value


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
