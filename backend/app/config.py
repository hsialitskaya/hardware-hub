from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables / .env."""

    database_url: str = "sqlite:///./hardware_hub.db"
    secret_key: str = "change-me-in-production"
    openai_api_key: str | None = None
    admin_email: str = "admin@booksy.com"
    admin_password: str = "ChangeMe123!"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
