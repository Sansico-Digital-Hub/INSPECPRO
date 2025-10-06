from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
import uuid

from database import get_db
from models import User, Inspection, InspectionResponse, InspectionFile, Form
from schemas import InspectionCreate, InspectionUpdate, InspectionResponse as InspectionResponseSchema, InspectionStatus
from auth import get_current_user, require_role

router = APIRouter()

@router.get("/", response_model=List[InspectionResponseSchema])
async def get_inspections(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[InspectionStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get inspections based on user role"""
    query = db.query(Inspection)
    
    # Filter based on user role
    if current_user.role.value == "user":
        # Users can only see their own inspections
        query = query.filter(Inspection.inspector_id == current_user.id)
    elif current_user.role.value in ["supervisor", "management", "admin"]:
        # Supervisors, management, and admins can see all inspections
        pass
    
    if status_filter:
        query = query.filter(Inspection.status == status_filter)
    
    inspections = query.offset(skip).limit(limit).all()
    return inspections

@router.get("/my-inspections", response_model=List[InspectionResponseSchema])
async def get_my_inspections(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's inspections"""
    inspections = db.query(Inspection).filter(
        Inspection.inspector_id == current_user.id
    ).offset(skip).limit(limit).all()
    return inspections

@router.get("/{inspection_id}", response_model=InspectionResponseSchema)
async def get_inspection(
    inspection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get inspection by ID"""
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found"
        )
    
    # Check permissions
    if (current_user.role.value == "user" and 
        inspection.inspector_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return inspection

@router.post("/", response_model=InspectionResponseSchema)
async def create_inspection(
    inspection: InspectionCreate,
    current_user: User = Depends(require_role(["user", "admin"])),
    db: Session = Depends(get_db)
):
    """Create new inspection"""
    # Verify form exists
    form = db.query(Form).filter(Form.id == inspection.form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Create inspection
    db_inspection = Inspection(
        form_id=inspection.form_id,
        inspector_id=current_user.id,
        status=InspectionStatus.draft
    )
    
    db.add(db_inspection)
    db.commit()
    db.refresh(db_inspection)
    
    # Create responses
    for response_data in inspection.responses:
        db_response = InspectionResponse(
            inspection_id=db_inspection.id,
            field_id=response_data.field_id,
            response_value=response_data.response_value,
            measurement_value=response_data.measurement_value,
            pass_hold_status=response_data.pass_hold_status
        )
        db.add(db_response)
    
    db.commit()
    db.refresh(db_inspection)
    
    return db_inspection

@router.put("/{inspection_id}", response_model=InspectionResponseSchema)
async def update_inspection(
    inspection_id: int,
    inspection_update: InspectionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update inspection"""
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found"
        )
    
    # Check permissions
    can_edit = False
    if current_user.role.value == "admin":
        can_edit = True
    elif current_user.role.value == "user" and inspection.inspector_id == current_user.id:
        # Users can only edit their own draft inspections
        can_edit = inspection.status == InspectionStatus.draft
    elif current_user.role.value in ["supervisor", "management"]:
        # Supervisors and management can review submitted inspections
        can_edit = inspection.status == InspectionStatus.submitted
    
    if not can_edit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions or inspection cannot be modified"
        )
    
    # Update inspection
    update_data = inspection_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(inspection, field, value)
    
    # If status is being changed to accepted/rejected, set reviewer info
    if inspection_update.status in [InspectionStatus.accepted, InspectionStatus.rejected]:
        inspection.reviewed_by = current_user.id
        inspection.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(inspection)
    
    return inspection

@router.post("/{inspection_id}/submit")
async def submit_inspection(
    inspection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit inspection for review"""
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found"
        )
    
    # Check permissions
    if (current_user.role.value == "user" and 
        inspection.inspector_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    if inspection.status != InspectionStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft inspections can be submitted"
        )
    
    inspection.status = InspectionStatus.submitted
    db.commit()
    
    return {"message": "Inspection submitted successfully"}

@router.delete("/{inspection_id}")
async def delete_inspection(
    inspection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete inspection"""
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found"
        )
    
    # Check permissions
    can_delete = False
    if current_user.role.value == "admin":
        can_delete = True
    elif (current_user.role.value == "user" and 
          inspection.inspector_id == current_user.id and 
          inspection.status == InspectionStatus.draft):
        can_delete = True
    
    if not can_delete:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db.delete(inspection)
    db.commit()
    
    return {"message": "Inspection deleted successfully"}

@router.post("/{inspection_id}/upload-file")
async def upload_file(
    inspection_id: int,
    field_id: int,
    file_type: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload file for inspection field"""
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found"
        )
    
    # Check permissions
    if (current_user.role.value == "user" and 
        inspection.inspector_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Create uploads directory if it doesn't exist
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Save file info to database
    db_file = InspectionFile(
        inspection_id=inspection_id,
        field_id=field_id,
        file_name=file.filename,
        file_path=file_path,
        file_type=file_type
    )
    
    db.add(db_file)
    db.commit()
    
    return {"message": "File uploaded successfully", "file_id": db_file.id}
