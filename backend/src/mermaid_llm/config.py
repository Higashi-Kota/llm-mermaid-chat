"""Application configuration using Pydantic Settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # OpenAI
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o"

    # Database
    database_url: str = (
        "postgresql+asyncpg://mermaid_llm:dev_password@localhost:5432/mermaid_llm"
    )

    # Application
    debug: bool = False
    use_mock: bool = False

    # CORS - comma-separated list of allowed origins
    cors_origins: str = ""

    @property
    def is_mock_mode(self) -> bool:
        """Check if mock mode is enabled (no API key or explicit mock flag)."""
        return self.use_mock or not self.openai_api_key

    @property
    def allowed_origins(self) -> list[str]:
        """Get list of allowed CORS origins."""
        # Default origins for local development
        default_origins = [
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175",
            "http://127.0.0.1:5173",
        ]
        # Add configured origins
        if self.cors_origins:
            extra = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
            return default_origins + extra
        return default_origins


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
