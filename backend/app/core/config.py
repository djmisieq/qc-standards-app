from pydantic_settings import BaseSettings
from pydantic import validator
import os
from typing import List, Optional, Union


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "QC Standards"
    VERSION: str = "0.1.0"
    
    # Security - Get from environment variable
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "dev_secret_key_change_in_production"  # Default for development only
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Environment
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database - Get from environment variable or use default
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:password@localhost:5432/qc_standards"
    )
    
    # Redis
    REDIS_URL: str = os.getenv(
        "REDIS_URL",
        "redis://localhost:6379/0"
    )
    
    # CORS - Updated to include GitHub Codespaces URLs
    BACKEND_CORS_ORIGINS: str = os.getenv(
        "BACKEND_CORS_ORIGINS",
        "http://localhost:5173,http://localhost:8080,https://*.github.dev,https://*.app.github.dev,https://*.githubpreview.dev"
    )
    
    # File upload settings
    UPLOADS_DIR: str = "photos"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_UPLOAD_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png"]
    
    # Default pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    @validator("BACKEND_CORS_ORIGINS")
    def validate_cors_origins(cls, v):
        return v
    
    @validator("SECRET_KEY")
    def validate_secret_key(cls, v, values):
        if values.get("ENVIRONMENT") == "production" and v == "dev_secret_key_change_in_production":
            raise ValueError("SECRET_KEY must be set in production environment")
        return v
        
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
