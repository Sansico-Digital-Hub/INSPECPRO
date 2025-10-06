from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Form, FormField
from schemas import FormCreate, FormUpdate, FormResponse, FormFieldCreate
from auth import get_current_user, require_role

router = APIRouter()

@router.get("/", response_model=List[FormResponse])
async def get_forms(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active forms"""
    forms = db.query(Form).filter(Form.is_active == True).offset(skip).limit(limit).all()
    return forms

@router.get("/{form_id}", response_model=FormResponse)
async def get_form(
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get form by ID"""
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    return form

@router.post("/", response_model=FormResponse)
async def create_form(
    form: FormCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Create new form (Admin only)"""
    # Create form
    db_form = Form(
        form_name=form.form_name,
        description=form.description,
        created_by=current_user.id
    )
    
    db.add(db_form)
    db.commit()
    db.refresh(db_form)
    
    # Create form fields
    for field_data in form.fields:
        db_field = FormField(
            form_id=db_form.id,
            field_name=field_data.field_name,
            field_type=field_data.field_type,
            field_options=field_data.field_options,
            measurement_type=field_data.measurement_type,
            measurement_min=field_data.measurement_min,
            measurement_max=field_data.measurement_max,
            is_required=field_data.is_required,
            field_order=field_data.field_order
        )
        db.add(db_field)
    
    db.commit()
    db.refresh(db_form)
    
    return db_form

@router.put("/{form_id}", response_model=FormResponse)
async def update_form(
    form_id: int,
    form_update: FormUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Update form (Admin only)"""
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Update form fields
    update_data = form_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(form, field, value)
    
    db.commit()
    db.refresh(form)
    
    return form

@router.delete("/{form_id}")
async def delete_form(
    form_id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Delete form (Admin only)"""
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Soft delete
    form.is_active = False
    db.commit()
    
    return {"message": "Form deleted successfully"}

@router.post("/{form_id}/fields")
async def add_form_field(
    form_id: int,
    field: FormFieldCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Add field to form (Admin only)"""
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    db_field = FormField(
        form_id=form_id,
        field_name=field.field_name,
        field_type=field.field_type,
        field_options=field.field_options,
        measurement_type=field.measurement_type,
        measurement_min=field.measurement_min,
        measurement_max=field.measurement_max,
        is_required=field.is_required,
        field_order=field.field_order
    )
    
    db.add(db_field)
    db.commit()
    db.refresh(db_field)
    
    return {"message": "Field added successfully", "field_id": db_field.id}

@router.delete("/{form_id}/fields/{field_id}")
async def delete_form_field(
    form_id: int,
    field_id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Delete field from form (Admin only)"""
    field = db.query(FormField).filter(
        FormField.id == field_id,
        FormField.form_id == form_id
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    db.delete(field)
    db.commit()
    
    return {"message": "Field deleted successfully"}

@router.put("/{form_id}/complete", response_model=FormResponse)
async def update_form_complete(
    form_id: int,
    form_data: FormCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Update form with fields (Admin only)"""
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Update form metadata
    form.form_name = form_data.form_name
    form.description = form_data.description
    
    # Delete existing fields
    db.query(FormField).filter(FormField.form_id == form_id).delete()
    
    # Add new fields
    for field_data in form_data.fields:
        db_field = FormField(
            form_id=form_id,
            field_name=field_data.field_name,
            field_type=field_data.field_type,
            field_options=field_data.field_options,
            measurement_type=field_data.measurement_type,
            measurement_min=field_data.measurement_min,
            measurement_max=field_data.measurement_max,
            is_required=field_data.is_required,
            field_order=field_data.field_order
        )
        db.add(db_field)
    
    db.commit()
    db.refresh(form)
    
    return form
