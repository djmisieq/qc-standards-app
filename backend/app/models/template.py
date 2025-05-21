from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship, Column, String, Enum, JSON
import enum


class TemplateStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class TemplateBase(SQLModel):
    name: str = Field(sa_column=Column(String(100), index=True))
    template_id: str = Field(sa_column=Column(String(20), unique=True, index=True))
    revision: str = Field(sa_column=Column(String(10)))
    status: TemplateStatus = Field(default=TemplateStatus.DRAFT)
    model_id: Optional[int] = Field(default=None, foreign_key="productmodel.id")
    stage_id: Optional[int] = Field(default=None, foreign_key="stage.id")
    metadata: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))


class Template(TemplateBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_by_id: Optional[int] = Field(default=None, foreign_key="user.id")
    approved_by_id: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = Field(default=None)
    
    # Relationships will be defined in SQLModel after all models are created


class TemplateCreate(TemplateBase):
    steps: Optional[List[Dict[str, Any]]] = None


class TemplateUpdate(SQLModel):
    name: Optional[str] = None
    revision: Optional[str] = None
    status: Optional[TemplateStatus] = None
    model_id: Optional[int] = None
    stage_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    approved_by_id: Optional[int] = None


class TemplateRead(TemplateBase):
    id: int
    created_by_id: Optional[int]
    approved_by_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]


class TemplateReadWithStats(TemplateRead):
    step_count: int
    checklist_count: int
    fpy_percentage: Optional[float]
    average_execution_time: Optional[int]
