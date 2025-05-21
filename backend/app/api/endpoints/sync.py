from typing import Any, Dict, List
from datetime import datetime
import json

from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlmodel import Session, select

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.models.template import Template, TemplateStatus
from app.models.checklist import QCDoc, QCResult
from app.models.step import Step

router = APIRouter()


@router.post("/templates")
async def sync_templates(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    last_sync: datetime = Query(None),  # If None, will sync all templates
) -> Dict[str, Any]:
    """
    Sync templates and steps for offline use.
    Returns all active templates modified since last_sync datetime.
    """
    # Get templates modified since last_sync
    query = select(Template).where(Template.status != TemplateStatus.ARCHIVED)
    
    if last_sync:
        query = query.where(Template.updated_at > last_sync)
    
    templates = db.exec(query).all()
    
    # Prepare response with templates and their steps
    result = {
        "sync_time": datetime.utcnow(),
        "templates": [],
    }
    
    for template in templates:
        # Get steps for template
        steps = db.exec(select(Step).where(Step.template_id == template.id)).all()
        
        # Convert to dict for serialization
        template_dict = template.model_dump()
        template_dict["steps"] = [step.model_dump() for step in steps]
        
        result["templates"].append(template_dict)
    
    return result


@router.post("/checklists")
async def sync_checklists(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    last_sync: datetime = Query(None),  # If None, will sync all user's checklists
    offline_checklists: List[Dict[str, Any]] = Body([]),  # Checklists created/updated offline
) -> Dict[str, Any]:
    """
    Bidirectional sync of checklists and results.
    Receives checklists created/updated offline and returns new server changes.
    """
    # Step 1: Process offline checklists (upload to server)
    for offline_checklist in offline_checklists:
        # Check if checklist exists by ID if provided
        existing_checklist = None
        if "id" in offline_checklist and offline_checklist["id"] is not None:
            existing_checklist = db.get(QCDoc, offline_checklist["id"])
        
        if existing_checklist:
            # Update existing checklist
            for key, value in offline_checklist.items():
                if key not in ["id", "results", "created_at", "updated_at"]:
                    setattr(existing_checklist, key, value)
            
            existing_checklist.updated_at = datetime.utcnow()
            db.add(existing_checklist)
            db.commit()
            db.refresh(existing_checklist)
            
            # Process results
            if "results" in offline_checklist:
                for offline_result in offline_checklist["results"]:
                    # Check if result exists
                    existing_result = None
                    if "id" in offline_result and offline_result["id"] is not None:
                        existing_result = db.get(QCResult, offline_result["id"])
                    elif "step_id" in offline_result:
                        # Look for result by step_id and checklist_id
                        existing_result = db.exec(
                            select(QCResult).where(
                                QCResult.qc_doc_id == existing_checklist.id,
                                QCResult.step_id == offline_result["step_id"]
                            )
                        ).first()
                    
                    if existing_result:
                        # Update existing result
                        for key, value in offline_result.items():
                            if key not in ["id", "qc_doc_id", "created_at"]:
                                setattr(existing_result, key, value)
                        
                        db.add(existing_result)
                    else:
                        # Create new result
                        new_result = QCResult(
                            **{k: v for k, v in offline_result.items() if k not in ["id", "created_at"]},
                            qc_doc_id=existing_checklist.id,
                            created_at=datetime.utcnow(),
                        )
                        db.add(new_result)
        else:
            # Create new checklist
            new_checklist = QCDoc(
                **{k: v for k, v in offline_checklist.items() if k not in ["id", "results", "created_at", "updated_at"]},
                created_by_id=current_user.id,  # Always use current user for new checklists
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(new_checklist)
            db.commit()
            db.refresh(new_checklist)
            
            # Process results
            if "results" in offline_checklist:
                for offline_result in offline_checklist["results"]:
                    new_result = QCResult(
                        **{k: v for k, v in offline_result.items() if k not in ["id", "qc_doc_id", "created_at"]},
                        qc_doc_id=new_checklist.id,
                        created_at=datetime.utcnow(),
                    )
                    db.add(new_result)
    
    db.commit()
    
    # Step 2: Get checklists modified since last_sync (download to client)
    query = select(QCDoc)
    
    # Only sync checklists created by or assigned to current user
    query = query.where(
        (QCDoc.created_by_id == current_user.id) | 
        (QCDoc.signed_off_by_id == current_user.id)
    )
    
    if last_sync:
        query = query.where(QCDoc.updated_at > last_sync)
    
    checklists = db.exec(query).all()
    
    # Prepare response with checklists and their results
    result = {
        "sync_time": datetime.utcnow(),
        "checklists": [],
    }
    
    for checklist in checklists:
        # Get results for checklist
        results = db.exec(select(QCResult).where(QCResult.qc_doc_id == checklist.id)).all()
        
        # Convert to dict for serialization
        checklist_dict = checklist.model_dump()
        checklist_dict["results"] = [result.model_dump() for result in results]
        
        result["checklists"].append(checklist_dict)
    
    return result
