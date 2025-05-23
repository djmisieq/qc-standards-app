from pydantic_settings import BaseSettings
from pydantic import validator
import os
from typing import List, Optional, Union


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "QC Standards"
    VERSION: str = "0.1.0"
    
    # Security
    SECRET_KEY: str = "dev_secret_key_change_in_production"  # Default for development
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Environment
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@db:5432/qc_standards"  # Default for Docker
    
    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    
    # CORS
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173,http://localhost:8080"
    
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
        
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
