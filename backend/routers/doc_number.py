from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime

from database import get_db
from models import Inspection, InspectionResponse, FormField, Form
from auth import get_current_user, User

router = APIRouter()

def generate_doc_number(form_id: int, db: Session) -> str:
    """
    Generate document number for a form
    Format: FORMABBR-YYYYNNNNN
    Example: GRF-20250001
    """
    # Get form details
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        return "DOC-20250001"
    
    # Generate abbreviation from form name (first 3 letters of each word, max 6 chars)
    words = form.form_name.upper().split()
    abbr = ''.join([w[:3] for w in words])[:6]
    
    # Get current year
    current_year = datetime.now().year
    
    # Find the last doc number for this form in current year
    # Query all inspections for this form
    inspections = db.query(Inspection).filter(
        Inspection.form_id == form_id
    ).all()
    
    max_number = 0
    prefix = f"{abbr}-{current_year}"
    
    # Check all responses for No Doc fields
    for inspection in inspections:
        responses = db.query(InspectionResponse).filter(
            InspectionResponse.inspection_id == inspection.id
        ).all()
        
        for response in responses:
            if response.response_value and response.response_value.startswith(prefix):
                try:
                    # Extract number from format: ABBR-YYYYNNNNN
                    number_part = response.response_value.split('-')[-1]
                    number = int(number_part)
                    if number > max_number:
                        max_number = number
                except:
                    pass
    
    # Generate next number
    next_number = max_number + 1
    doc_number = f"{abbr}-{current_year}{next_number:04d}"
    
    return doc_number

@router.get("/forms/{form_id}/next-doc-number")
async def get_next_doc_number(
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the next document number for a form"""
    doc_number = generate_doc_number(form_id, db)
    return {"doc_number": doc_number}
