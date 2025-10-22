from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Form, FormField, InspectionResponse
from schemas import FormCreate, FormUpdate, FormResponse, FormFieldCreate
from auth import get_current_user, require_role
from validators import validate_form_field_before_save, SubformValidationError

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

def validate_subform_fields(field_data):
    """Validate subform fields using the comprehensive validator"""
    try:
        # Convert field_data to dict if it's a Pydantic model
        if hasattr(field_data, 'dict'):
            field_dict = field_data.dict()
        else:
            field_dict = field_data
        
        # Use the comprehensive validator
        validated_field = validate_form_field_before_save(field_dict)
        
        # Update the original field_data with validated values
        if hasattr(field_data, 'field_options') and 'field_options' in validated_field:
            field_data.field_options = validated_field['field_options']
            
    except SubformValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/", response_model=FormResponse)
async def create_form(
    form: FormCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Create new form (Admin only)"""
    # Validate all fields including subform fields
    for field_data in form.fields:
        validate_subform_fields(field_data)
    
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
            field_types=field_data.field_types,
            field_options=field_data.field_options,
            placeholder_text=field_data.placeholder_text,
            measurement_type=field_data.measurement_type,
            measurement_min=field_data.measurement_min,
            measurement_max=field_data.measurement_max,
            is_required=field_data.is_required,
            field_order=field_data.field_order,
            flag_conditions=field_data.flag_conditions
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

@router.put("/{form_id}/fields/{field_id}/flag-conditions")
async def update_field_flag_conditions(
    form_id: int,
    field_id: int,
    flag_conditions: dict,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Update flag conditions for a specific form field (Admin only)"""
    field = db.query(FormField).filter(
        FormField.id == field_id,
        FormField.form_id == form_id
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    field.flag_conditions = flag_conditions
    db.commit()
    db.refresh(field)
    
    return {"message": "Flag conditions updated successfully", "flag_conditions": field.flag_conditions}

@router.get("/{form_id}/fields/{field_id}/flag-conditions")
async def get_field_flag_conditions(
    form_id: int,
    field_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get flag conditions for a specific form field"""
    field = db.query(FormField).filter(
        FormField.id == field_id,
        FormField.form_id == form_id
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    return {"field_id": field.id, "flag_conditions": field.flag_conditions}

@router.delete("/{form_id}/fields/{field_id}/flag-conditions")
async def delete_field_flag_conditions(
    form_id: int,
    field_id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Remove flag conditions from a specific form field (Admin only)"""
    field = db.query(FormField).filter(
        FormField.id == field_id,
        FormField.form_id == form_id
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    field.flag_conditions = None
    db.commit()
    
    return {"message": "Flag conditions removed successfully"}

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
    
    # Validate subform fields before adding
    validate_subform_fields(field)
    
    db_field = FormField(
        form_id=form_id,
        field_name=field.field_name,
        field_type=field.field_type,
        field_options=field.field_options,
        measurement_type=field.measurement_type,
        measurement_min=field.measurement_min,
        measurement_max=field.measurement_max,
        is_required=field.is_required,
        field_order=field.field_order,
        flag_conditions=field.flag_conditions
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
    
    # Get existing fields
    existing_fields = db.query(FormField).filter(FormField.form_id == form_id).all()
    existing_field_ids = {field.id for field in existing_fields}
    
    # Track which fields are in the update
    updated_field_ids = set()
    
    # Validate all fields including subform fields before processing
    for field_data in form_data.fields:
        validate_subform_fields(field_data)
    
    # Update or create fields
    for field_data in form_data.fields:
        if hasattr(field_data, 'id') and field_data.id and field_data.id in existing_field_ids:
            # Update existing field
            db_field = db.query(FormField).filter(FormField.id == field_data.id).first()
            if db_field:
                db_field.field_name = field_data.field_name
                db_field.field_type = field_data.field_type
                db_field.field_types = field_data.field_types
                db_field.field_options = field_data.field_options
                db_field.placeholder_text = field_data.placeholder_text
                db_field.measurement_type = field_data.measurement_type
                db_field.measurement_min = field_data.measurement_min
                db_field.measurement_max = field_data.measurement_max
                db_field.is_required = field_data.is_required
                db_field.field_order = field_data.field_order
                db_field.flag_conditions = field_data.flag_conditions
                updated_field_ids.add(field_data.id)
        else:
            # Create new field
            db_field = FormField(
                form_id=form_id,
                field_name=field_data.field_name,
                field_type=field_data.field_type,
                field_types=field_data.field_types,
                field_options=field_data.field_options,
                placeholder_text=field_data.placeholder_text,
                measurement_type=field_data.measurement_type,
                measurement_min=field_data.measurement_min,
                measurement_max=field_data.measurement_max,
                is_required=field_data.is_required,
                field_order=field_data.field_order,
                flag_conditions=field_data.flag_conditions
            )
            db.add(db_field)
    
    # Delete fields that are no longer in the form (only if they have no responses)
    for field_id in existing_field_ids - updated_field_ids:
        field_to_delete = db.query(FormField).filter(FormField.id == field_id).first()
        if field_to_delete:
            # Check if field has any responses
            response_count = db.query(InspectionResponse).filter(
                InspectionResponse.field_id == field_id
            ).count()
            
            if response_count == 0:
                # Safe to delete - no responses reference this field
                db.delete(field_to_delete)
            # If there are responses, keep the field (don't delete)
    
    db.commit()
    db.refresh(form)
    
    return form
