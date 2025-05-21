from typing import Optional, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, Column, String, Enum, JSON
import enum


class StepCategory(str, enum.Enum):
    CRITICAL = "critical"
    MAJOR = "major"
    MINOR = "minor"
    COSMETIC = "cosmetic"


class StepBase(SQLModel):
    code: str = Field(sa_column=Column(String(20)))
    description: str
    requirement: str
    category: StepCategory = Field(default=StepCategory.MAJOR)
    photo_required: bool = Field(default=False)
    std_time: int = Field(default=30)  # seconds
    metadata: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))


class Step(StepBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    template_id: int = Field(foreign_key="template.id")
    
    # Relationships will be defined in SQLModel after all models are created


class StepCreate(StepBase):
    template_id: int


class StepUpdate(SQLModel):
    code: Optional[str] = None
    description: Optional[str] = None
    requirement: Optional[str] = None
    category: Optional[StepCategory] = None
    photo_required: Optional[bool] = None
    std_time: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class StepRead(StepBase):
    id: int
    template_id: int
