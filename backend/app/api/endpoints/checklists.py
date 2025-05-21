from typing import Any, List, Optional
from datetime import datetime
import os
from pathlib import Path
import shutil

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from app.api.deps import get_current_active_user, get_current_qc_engineer, get_current_production_leader
from app.db.session import get_db
from app.core.config import settings
from app.models.user import User
from app.models.checklist import QCDoc, QCDocCreate, QCDocUpdate, QCDocRead, QCResult, QCResultCreate, QCResultRead, QCDocStatus

router = APIRouter()


@router.post("/", response_model=QCDocRead)
async def create_checklist(
    *,
    db: Session = Depends(get_db),
    checklist_in: QCDocCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create new checklist.
    """
    # Create checklist
    db_checklist = QCDoc(
        **checklist_in.model_dump(exclude={"results"}),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(db_checklist)
    db.commit()
    db.refresh(db_checklist)
    
    # Create results if provided
    if checklist_in.results:
        for result_data in checklist_in.results:
            db_result = QCResult(
                **result_data,
                qc_doc_id=db_checklist.id,
                created_at=datetime.utcnow(),
            )
            db.add(db_result)
        
        db.commit()
        db.refresh(db_checklist)
    
    return db_checklist


@router.get("/", response_model=List[QCDocRead])
async def list_checklists(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    template_id: Optional[int] = None,
    status: Optional[QCDocStatus] = None,
    serial_no: Optional[str] = None,
) -> Any:
    """
    Retrieve checklists with filtering.
    """
    query = select(QCDoc)
    
    # Apply filters
    if template_id:
        query = query.where(QCDoc.template_id == template_id)
    if status:
        query = query.where(QCDoc.status == status)
    if serial_no:
        query = query.where(QCDoc.serial_no.contains(serial_no))
    
    # Execute query with pagination
    checklists = db.exec(query.offset(skip).limit(limit)).all()
    return checklists


@router.get("/{checklist_id}", response_model=QCDocRead)
async def get_checklist(
    *,
    db: Session = Depends(get_db),
    checklist_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get checklist by ID.
    """
    checklist = db.get(QCDoc, checklist_id)
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found",
        )
    return checklist


@router.put("/{checklist_id}", response_model=QCDocRead)
async def update_checklist(
    *,
    db: Session = Depends(get_db),
    checklist_id: int,
    checklist_in: QCDocUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update a checklist.
    """
    checklist = db.get(QCDoc, checklist_id)
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found",
        )
    
    # Check if user is authorized to update the checklist
    if checklist.created_by_id != current_user.id and current_user.role not in ["qc_engineer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Update checklist fields
    checklist_data = checklist_in.model_dump(exclude_unset=True)
    
    # Special handling for status transitions
    if "status" in checklist_data and checklist_data["status"] == QCDocStatus.COMPLETED:
        if checklist.status == QCDocStatus.IN_PROGRESS:
            checklist_data["completed_at"] = datetime.utcnow()
    
    # Always update the updated_at timestamp
    checklist_data["updated_at"] = datetime.utcnow()
    
    for key, value in checklist_data.items():
        setattr(checklist, key, value)
    
    db.add(checklist)
    db.commit()
    db.refresh(checklist)
    
    return checklist


@router.post("/{checklist_id}/complete", response_model=QCDocRead)
async def complete_checklist(
    *,
    db: Session = Depends(get_db),
    checklist_id: int,
    signed_off_by_id: Optional[int] = Body(None),  # Optional production leader sign-off
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Mark a checklist as completed.
    """
    checklist = db.get(QCDoc, checklist_id)
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found",
        )
    
    if checklist.status != QCDocStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only in-progress checklists can be completed",
        )
    
    # Check if all steps have results
    template_steps = db.exec(select(Step).where(Step.template_id == checklist.template_id)).all()
    checklist_results = db.exec(select(QCResult).where(QCResult.qc_doc_id == checklist.id)).all()
    
    if len(template_steps) != len(checklist_results):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="All steps must have results before completing the checklist",
        )
    
    # Update checklist status
    checklist.status = QCDocStatus.COMPLETED
    checklist.completed_at = datetime.utcnow()
    checklist.updated_at = datetime.utcnow()
    
    # Set signed_off_by if provided and user is a production leader
    if signed_off_by_id:
        checklist.signed_off_by_id = signed_off_by_id
    
    db.add(checklist)
    db.commit()
    db.refresh(checklist)
    
    return checklist


@router.post("/{checklist_id}/results", response_model=QCResultRead)
async def create_result(
    *,
    db: Session = Depends(get_db),
    checklist_id: int,
    result_in: QCResultCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create a result for a step in the checklist.
    """
    # Check if checklist exists
    checklist = db.get(QCDoc, checklist_id)
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found",
        )
    
    # Check if checklist is still in progress
    if checklist.status != QCDocStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Results can only be added to in-progress checklists",
        )
    
    # Check if result already exists for this step
    existing_result = db.exec(
        select(QCResult).where(
            QCResult.qc_doc_id == checklist_id,
            QCResult.step_id == result_in.step_id
        )
    ).first()
    
    if existing_result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A result for this step already exists",
        )
    
    # Create result
    result = QCResult(
        **result_in.model_dump(),
        created_at=datetime.utcnow(),
    )
    db.add(result)
    
    # Update checklist updated_at timestamp
    checklist.updated_at = datetime.utcnow()
    db.add(checklist)
    
    db.commit()
    db.refresh(result)
    
    return result


@router.put("/{checklist_id}/results/{result_id}", response_model=QCResultRead)
async def update_result(
    *,
    db: Session = Depends(get_db),
    checklist_id: int,
    result_id: int,
    result_in: QCResultUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update a result for a step in the checklist.
    """
    # Check if checklist exists
    checklist = db.get(QCDoc, checklist_id)
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found",
        )
    
    # Check if checklist is still in progress
    if checklist.status != QCDocStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Results can only be updated in in-progress checklists",
        )
    
    # Check if result exists
    result = db.get(QCResult, result_id)
    if not result or result.qc_doc_id != checklist_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Result not found",
        )
    
    # Update result fields
    result_data = result_in.model_dump(exclude_unset=True)
    for key, value in result_data.items():
        setattr(result, key, value)
    
    db.add(result)
    
    # Update checklist updated_at timestamp
    checklist.updated_at = datetime.utcnow()
    db.add(checklist)
    
    db.commit()
    db.refresh(result)
    
    return result


@router.post("/{checklist_id}/results/{result_id}/upload")
async def upload_photo(
    *,
    db: Session = Depends(get_db),
    checklist_id: int,
    result_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """
    Upload a photo for a result.
    """
    # Check if checklist exists
    checklist = db.get(QCDoc, checklist_id)
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found",
        )
    
    # Check if result exists
    result = db.get(QCResult, result_id)
    if not result or result.qc_doc_id != checklist_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Result not found",
        )
    
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension {file_ext} not allowed",
        )
    
    # Create directory for photos if it doesn't exist
    photos_dir = Path(settings.UPLOADS_DIR) / str(checklist_id)
    photos_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate file path and save photo
    photo_path = f"{result_id}{file_ext}"
    file_path = photos_dir / photo_path
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()
    
    # Update result with photo path
    result.photo_path = f"{checklist_id}/{photo_path}"
    db.add(result)
    db.commit()
    db.refresh(result)
    
    return {"filename": photo_path, "path": result.photo_path}


@router.get("/{checklist_id}/results/{result_id}/photo")
async def get_photo(
    *,
    db: Session = Depends(get_db),
    checklist_id: int,
    result_id: int,
    current_user: User = Depends(get_current_active_user),
) -> FileResponse:
    """
    Get photo for a result.
    """
    # Check if result exists
    result = db.get(QCResult, result_id)
    if not result or result.qc_doc_id != checklist_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Result not found",
        )
    
    if not result.photo_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No photo found for this result",
        )
    
    # Get photo path
    file_path = Path(settings.UPLOADS_DIR) / result.photo_path
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo file not found",
        )
    
    return FileResponse(file_path)
