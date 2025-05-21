from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.deps import get_current_active_user, get_current_qc_engineer
from app.db.session import get_db
from app.models.user import User
from app.models.step import Step, StepCreate, StepUpdate, StepRead

router = APIRouter()


@router.post("/", response_model=StepRead)
async def create_step(
    *,
    db: Session = Depends(get_db),
    step_in: StepCreate,
    current_user: User = Depends(get_current_qc_engineer),
) -> Any:
    """
    Create new step.
    """
    db_step = Step.model_validate(step_in)
    db.add(db_step)
    db.commit()
    db.refresh(db_step)
    return db_step


@router.get("/", response_model=List[StepRead])
async def list_steps(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    template_id: int = None,
) -> Any:
    """
    Retrieve steps.
    """
    query = select(Step)
    if template_id:
        query = query.where(Step.template_id == template_id)
    
    steps = db.exec(query.offset(skip).limit(limit)).all()
    return steps


@router.get("/{step_id}", response_model=StepRead)
async def get_step(
    *,
    db: Session = Depends(get_db),
    step_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get step by ID.
    """
    step = db.get(Step, step_id)
    if not step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Step not found",
        )
    return step


@router.put("/{step_id}", response_model=StepRead)
async def update_step(
    *,
    db: Session = Depends(get_db),
    step_id: int,
    step_in: StepUpdate,
    current_user: User = Depends(get_current_qc_engineer),
) -> Any:
    """
    Update a step.
    """
    step = db.get(Step, step_id)
    if not step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Step not found",
        )
    
    # Update step fields
    step_data = step_in.model_dump(exclude_unset=True)
    for key, value in step_data.items():
        setattr(step, key, value)
    
    db.add(step)
    db.commit()
    db.refresh(step)
    
    return step


@router.delete("/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_step(
    *,
    db: Session = Depends(get_db),
    step_id: int,
    current_user: User = Depends(get_current_qc_engineer),
) -> None:
    """
    Delete a step.
    """
    step = db.get(Step, step_id)
    if not step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Step not found",
        )
    
    db.delete(step)
    db.commit()
