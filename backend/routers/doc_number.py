from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime
import re

from database import get_db
from models import Inspection, InspectionResponse, FormField, Form
from auth import get_current_user, User

router = APIRouter()

def generate_doc_number(form_id: int, db: Session) -> str:
    """
    Generate document number for a form
    Format: FORMABBR-YYYYN  (incremental without zero padding)
    Example: GRA-IN-20251, GRA-IN-20252
    """
    # Get form details
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        return "DOC-20250001"
    
    # Generate abbreviation from the first two words only (3 letters each), sanitized, hyphenated
    # Example: "Graphic Inspection Report" -> "GRA-INS"
    import re as _re
    tokens = _re.findall(r"[A-Za-z0-9]+", (form.form_name or "").upper())
    part1 = tokens[0][:3] if len(tokens) >= 1 else "DOC"
    part2 = tokens[1][:3] if len(tokens) >= 2 else None
    abbr = '-'.join([p for p in [part1, part2] if p])
    
    # Get current year
    current_year = datetime.now().year
    
    print(f"🔢 Generating doc number for form: {form.form_name}")
    print(f"📝 Abbreviation: {abbr}")
    print(f"📅 Year: {current_year}")
    
    # Find the last doc number for this form in current year
    # Query all inspections for this form
    inspections = db.query(Inspection).filter(
        Inspection.form_id == form_id
    ).all()
    
    max_number = 0
    prefix = f"{abbr}-{current_year}"
    
    print(f"🔍 Looking for doc numbers with prefix: {prefix}")
    
    # Check all responses for No Doc fields
    found_doc_numbers = []
    for inspection in inspections:
        responses = db.query(InspectionResponse).filter(
            InspectionResponse.inspection_id == inspection.id
        ).all()
        
        for response in responses:
            if response.response_value and response.response_value.startswith(prefix):
                found_doc_numbers.append(response.response_value)
                try:
                    # Extract sequence from format: ABBR-YYYYN (or messy legacy like ABBR-YYYYYYYY...NNNN)
                    # Take the substring after the last '-' and strip all leading occurrences of the current year
                    # Example correct:  "20253"        -> year=2025, tail="3"
                    # Example legacy:   "202520250004" -> year=2025, tail="0004"
                    number_part = response.response_value.split('-')[-1]
                    year_str = str(current_year)
                    # Remove all repeated year prefixes at the start
                    while number_part.startswith(year_str):
                        number_part = number_part[len(year_str):]
                    # If empty after stripping, treat as 0
                    tail = number_part or "0"
                    # Allow leading zeros
                    sequence_number = int(tail)
                    print(f"  📄 Found: {response.response_value} -> seq: {sequence_number}")
                    
                    if sequence_number > max_number:
                        max_number = sequence_number
                        print(f"    ✅ New max: {max_number}")
                except Exception as e:
                    print(f"    ❌ Error parsing: {e}")
                    pass
    
    print(f"📊 Found {len(found_doc_numbers)} existing doc numbers: {found_doc_numbers}")
    print(f"🔢 Max sequence number: {max_number}")
    
    # Generate next number
    next_number = max_number + 1
    # New format without zero padding: ABBR-YYYYN
    doc_number = f"{abbr}-{current_year}{next_number}"
    
    print(f"✅ Generated doc number: {doc_number}")
    
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
