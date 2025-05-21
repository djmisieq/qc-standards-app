from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship, Column, String, Enum, JSON
import enum


class QCDocStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REJECTED = "rejected"


class QCDocBase(SQLModel):
    serial_no: str = Field(sa_column=Column(String(50), index=True))
    status: QCDocStatus = Field(default=QCDocStatus.IN_PROGRESS)
    metadata: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))


class QCDoc(QCDocBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    template_id: int = Field(foreign_key="template.id")
    created_by_id: int = Field(foreign_key="user.id")
    signed_off_by_id: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = Field(default=None)
    execution_time: Optional[int] = Field(default=None)  # seconds
    
    # Relationships will be defined in SQLModel after all models are created


class QCResultBase(SQLModel):
    ok_flag: bool
    comment: Optional[str] = None
    photo_path: Optional[str] = None
    execution_time: Optional[int] = None  # seconds
    metadata: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))


class QCResult(QCResultBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    qc_doc_id: int = Field(foreign_key="qcdoc.id")
    step_id: int = Field(foreign_key="step.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships will be defined in SQLModel after all models are created


class QCDocCreate(QCDocBase):
    template_id: int
    created_by_id: int
    results: Optional[List[Dict[str, Any]]] = None


class QCDocUpdate(SQLModel):
    status: Optional[QCDocStatus] = None
    signed_off_by_id: Optional[int] = None
    execution_time: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class QCResultCreate(QCResultBase):
    qc_doc_id: int
    step_id: int


class QCResultUpdate(SQLModel):
    ok_flag: Optional[bool] = None
    comment: Optional[str] = None
    photo_path: Optional[str] = None
    execution_time: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class QCResultRead(QCResultBase):
    id: int
    qc_doc_id: int
    step_id: int
    created_at: datetime


class QCDocRead(QCDocBase):
    id: int
    template_id: int
    created_by_id: int
    signed_off_by_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    execution_time: Optional[int]
