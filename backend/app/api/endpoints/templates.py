from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.template import Template, TemplateCreate, TemplateUpdate
from app.models.user import User

router = APIRouter()

@router.get("", response_model=List[Template])
async def list_templates(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of templates
    """
    templates = db.exec(select(Template).offset(skip).limit(limit)).all()
    return templates

@router.post("", response_model=Template)
async def create_template(
    template_in: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create new template
    """
    template = Template.from_orm(template_in)
    template.created_by_id = current_user.id
    
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return template

@router.get("/{template_id}", response_model=Template)
async def get_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get template by ID
    """
    template = db.get(Template, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return template

@router.put("/{template_id}", response_model=Template)
async def update_template(
    template_id: int,
    template_in: TemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update template
    """
    template = db.get(Template, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    if not current_user.is_admin and template.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    for field, value in template_in.dict(exclude_unset=True).items():
        setattr(template, field, value)
    
    template.updated_by_id = current_user.id
    
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return template

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete template
    """
    template = db.get(Template, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    if not current_user.is_admin and template.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db.delete(template)
    db.commit()
    
    return None
