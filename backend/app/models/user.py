from typing import Optional, List
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship, Column, Enum, String
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    QC_ENGINEER = "qc_engineer"
    PRODUCTION_LEADER = "production_leader"
    QC_OPERATOR = "qc_operator"
    VIEWER = "viewer"


class UserBase(SQLModel):
    username: str = Field(sa_column=Column(String(50), unique=True, index=True))
    email: str = Field(sa_column=Column(String(100), unique=True, index=True))
    full_name: str = Field(default="", sa_column=Column(String(100)))
    role: UserRole = Field(default=UserRole.VIEWER)
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships will be defined in SQLModel after all models are created


class UserCreate(UserBase):
    password: str


class UserUpdate(SQLModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime


class UserReadWithStats(UserRead):
    template_count: int
    checklist_count: int
