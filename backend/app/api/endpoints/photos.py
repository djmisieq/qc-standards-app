from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlmodel import Session
import uuid
import os
from pathlib import Path
from typing import List

from app.api.deps import get_current_user
from app.db.session import get_db
from app.core.config import settings
from app.models.user import User
from app.models.photo import Photo, PhotoCreate, PhotoResponse

router = APIRouter()

@router.post("", response_model=PhotoResponse)
async def upload_photo(
    file: UploadFile = File(...),
    checklist_id: int = None,
    note: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a photo for a checklist
    """
    # Validate file size
    file.file.seek(0, 2)  # Go to end of file
    file_size = file.file.tell()  # Get file size
    file.file.seek(0)  # Go back to start
    
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed ({settings.MAX_UPLOAD_SIZE} bytes)"
        )
    
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File extension not allowed. Allowed extensions: {', '.join(settings.ALLOWED_UPLOAD_EXTENSIONS)}"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = Path(settings.UPLOADS_DIR) / unique_filename
    
    # Save file
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Create photo record
    photo_in = PhotoCreate(
        filename=unique_filename,
        original_filename=file.filename,
        checklist_id=checklist_id,
        note=note
    )
    
    photo = Photo.from_orm(photo_in)
    photo.uploaded_by_id = current_user.id
    
    db.add(photo)
    db.commit()
    db.refresh(photo)
    
    return PhotoResponse(
        id=photo.id,
        filename=photo.filename,
        url=f"/photos/{photo.filename}",
        original_filename=photo.original_filename,
        note=photo.note,
        uploaded_by_id=photo.uploaded_by_id,
        created_at=photo.created_at
    )

@router.get("/{photo_id}", response_model=PhotoResponse)
async def get_photo(
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get photo by ID
    """
    photo = db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )
    
    return PhotoResponse(
        id=photo.id,
        filename=photo.filename,
        url=f"/photos/{photo.filename}",
        original_filename=photo.original_filename,
        note=photo.note,
        uploaded_by_id=photo.uploaded_by_id,
        created_at=photo.created_at
    )

@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete photo
    """
    photo = db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )
    
    # Check permissions
    if not current_user.is_admin and photo.uploaded_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Delete file
    file_path = Path(settings.UPLOADS_DIR) / photo.filename
    if file_path.exists():
        os.remove(file_path)
    
    # Delete record
    db.delete(photo)
    db.commit()
    
    return None
