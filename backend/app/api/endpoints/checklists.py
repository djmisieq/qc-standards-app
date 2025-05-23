from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.checklist import Checklist, ChecklistCreate, ChecklistUpdate
from app.models.user import User

router = APIRouter()

@router.get("", response_model=List[Checklist])
async def list_checklists(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of checklists
    """
    checklists = db.exec(select(Checklist).offset(skip).limit(limit)).all()
    return checklists

@router.post("", response_model=Checklist)
async def create_checklist(
    checklist_in: ChecklistCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create new checklist
    """
    checklist = Checklist.from_orm(checklist_in)
    checklist.created_by_id = current_user.id
    
    db.add(checklist)
    db.commit()
    db.refresh(checklist)
    
    return checklist

@router.get("/{checklist_id}", response_model=Checklist)
async def get_checklist(
    checklist_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get checklist by ID
    """
    checklist = db.get(Checklist, checklist_id)
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found"
        )
    
    return checklist

@router.put("/{checklist_id}", response_model=Checklist)
async def update_checklist(
    checklist_id: int,
    checklist_in: ChecklistUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update checklist
    """
    checklist = db.get(Checklist, checklist_id)
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found"
        )
    
    if not current_user.is_admin and checklist.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    for field, value in checklist_in.dict(exclude_unset=True).items():
        setattr(checklist, field, value)
    
    checklist.updated_by_id = current_user.id
    
    db.add(checklist)
    db.commit()
    db.refresh(checklist)
    
    return checklist

@router.delete("/{checklist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_checklist(
    checklist_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete checklist
    """
    checklist = db.get(Checklist, checklist_id)
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found"
        )
    
    if not current_user.is_admin and checklist.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db.delete(checklist)
    db.commit()
    
    return None
