from typing import Any, List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlmodel import Session, select

from app.api.deps import get_current_active_user, get_current_qc_engineer
from app.db.session import get_db
from app.models.user import User
from app.models.template import Template, TemplateCreate, TemplateUpdate, TemplateRead, TemplateReadWithStats, TemplateStatus
from app.models.step import Step, StepCreate

router = APIRouter()


@router.post("/", response_model=TemplateRead)
async def create_template(
    *,
    db: Session = Depends(get_db),
    template_in: TemplateCreate,
    current_user: User = Depends(get_current_qc_engineer),
) -> Any:
    """
    Create new template with steps.
    """
    # Check if template_id already exists
    db_template = db.exec(select(Template).where(Template.template_id == template_in.template_id)).first()
    if db_template:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Template with ID {template_in.template_id} already exists",
        )
    
    # Create template
    db_template = Template(
        **template_in.model_dump(exclude={"steps"}),
        created_by_id=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    # Create steps if provided
    if template_in.steps:
        for step_data in template_in.steps:
            db_step = Step(
                **step_data,
                template_id=db_template.id,
            )
            db.add(db_step)
    
    db.commit()
    db.refresh(db_template)
    
    return db_template


@router.get("/", response_model=List[TemplateReadWithStats])
async def list_templates(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = Query(default=100, le=100),
    status: Optional[TemplateStatus] = None,
    model_id: Optional[int] = None,
    stage_id: Optional[int] = None,
) -> Any:
    """
    Retrieve templates with filtering.
    """
    query = select(Template)
    
    # Apply filters
    if status:
        query = query.where(Template.status == status)
    if model_id:
        query = query.where(Template.model_id == model_id)
    if stage_id:
        query = query.where(Template.stage_id == stage_id)
    
    # Execute query with pagination
    templates = db.exec(query.offset(skip).limit(limit)).all()
    
    # Add statistics
    result = []
    for template in templates:
        # Get step count
        step_count = db.exec(select(Step).where(Step.template_id == template.id)).count()
        
        # Get checklist count (simplified - in production would calculate FPY and avg execution time)
        checklist_count = len(template.checklists) if template.checklists else 0
        
        template_data = TemplateReadWithStats(
            **template.model_dump(),
            step_count=step_count,
            checklist_count=checklist_count,
            fpy_percentage=None,  # Would be calculated from checklist results
            average_execution_time=None,  # Would be calculated from checklist results
        )
        result.append(template_data)
    
    return result


@router.get("/{template_id}", response_model=TemplateRead)
async def get_template(
    *,
    db: Session = Depends(get_db),
    template_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get template by ID.
    """
    template = db.get(Template, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )
    return template


@router.put("/{template_id}", response_model=TemplateRead)
async def update_template(
    *,
    db: Session = Depends(get_db),
    template_id: int,
    template_in: TemplateUpdate,
    current_user: User = Depends(get_current_qc_engineer),
) -> Any:
    """
    Update a template.
    """
    template = db.get(Template, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )
    
    # Update template fields
    template_data = template_in.model_dump(exclude_unset=True)
    
    # Special handling for status transitions
    if "status" in template_data and template_data["status"] == TemplateStatus.PUBLISHED:
        if template.status == TemplateStatus.DRAFT:
            template_data["published_at"] = datetime.utcnow()
            # Require approval for publishing
            if not template_data.get("approved_by_id"):
                template_data["approved_by_id"] = current_user.id
    
    # Always update the updated_at timestamp
    template_data["updated_at"] = datetime.utcnow()
    
    for key, value in template_data.items():
        setattr(template, key, value)
    
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return template


@router.post("/{template_id}/publish", response_model=TemplateRead)
async def publish_template(
    *,
    db: Session = Depends(get_db),
    template_id: int,
    current_user: User = Depends(get_current_qc_engineer),
) -> Any:
    """
    Publish a template (move from DRAFT to PUBLISHED).
    """
    template = db.get(Template, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )
    
    if template.status != TemplateStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft templates can be published",
        )
    
    # Update template status
    template.status = TemplateStatus.PUBLISHED
    template.published_at = datetime.utcnow()
    template.updated_at = datetime.utcnow()
    template.approved_by_id = current_user.id
    
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return template


@router.post("/{template_id}/archive", response_model=TemplateRead)
async def archive_template(
    *,
    db: Session = Depends(get_db),
    template_id: int,
    current_user: User = Depends(get_current_qc_engineer),
) -> Any:
    """
    Archive a template.
    """
    template = db.get(Template, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )
    
    if template.status == TemplateStatus.ARCHIVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template is already archived",
        )
    
    # Update template status
    template.status = TemplateStatus.ARCHIVED
    template.updated_at = datetime.utcnow()
    
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return template


@router.post("/{template_id}/clone", response_model=TemplateRead)
async def clone_template(
    *,
    db: Session = Depends(get_db),
    template_id: int,
    new_revision: str = Body(...),
    current_user: User = Depends(get_current_qc_engineer),
) -> Any:
    """
    Clone a template with a new revision.
    """
    template = db.get(Template, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )
    
    # Check if revision already exists
    existing = db.exec(
        select(Template).where(
            Template.template_id == template.template_id,
            Template.revision == new_revision
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Revision {new_revision} already exists for template {template.template_id}",
        )
    
    # Create new template
    new_template = Template(
        name=template.name,
        template_id=template.template_id,
        revision=new_revision,
        status=TemplateStatus.DRAFT,
        model_id=template.model_id,
        stage_id=template.stage_id,
        metadata=template.metadata,
        created_by_id=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    
    # Clone steps
    steps = db.exec(select(Step).where(Step.template_id == template.id)).all()
    for step in steps:
        new_step = Step(
            code=step.code,
            description=step.description,
            requirement=step.requirement,
            category=step.category,
            photo_required=step.photo_required,
            std_time=step.std_time,
            metadata=step.metadata,
            template_id=new_template.id,
        )
        db.add(new_step)
    
    db.commit()
    db.refresh(new_template)
    
    return new_template
