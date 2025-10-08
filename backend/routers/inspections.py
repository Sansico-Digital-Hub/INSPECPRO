from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
import uuid
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from io import BytesIO
import base64

from database import get_db
from models import User, Inspection, InspectionResponse, InspectionFile, Form, FormField
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

@router.get("/{inspection_id}/export-pdf")
async def export_inspection_to_pdf(
    inspection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export inspection to PDF with questions on left and answers on right"""
    # Get inspection with all related data
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
    
    # Get form and fields
    form = db.query(Form).filter(Form.id == inspection.form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Get inspector info
    inspector = db.query(User).filter(User.id == inspection.inspector_id).first()
    
    # Create PDF
    pdf_filename = f"inspection_{inspection_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    pdf_path = os.path.join("uploads", pdf_filename)
    os.makedirs("uploads", exist_ok=True)
    
    # Create the PDF document
    doc = SimpleDocTemplate(pdf_path, pagesize=A4, 
                           rightMargin=30, leftMargin=30,
                           topMargin=30, bottomMargin=30)
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=10
    )
    
    normal_style = styles['Normal']
    
    # Title
    title = Paragraph(f"<b>Inspection Report</b>", title_style)
    elements.append(title)
    elements.append(Spacer(1, 12))
    
    # Inspection Info Table
    info_data = [
        ['Inspection ID:', str(inspection.id)],
        ['Form:', form.form_name],
        ['Inspector:', inspector.username if inspector else 'N/A'],
        ['Status:', inspection.status.value.upper()],
        ['Created:', inspection.created_at.strftime('%Y-%m-%d %H:%M:%S')],
        ['Updated:', inspection.updated_at.strftime('%Y-%m-%d %H:%M:%S')]
    ]
    
    if inspection.reviewed_by:
        reviewer = db.query(User).filter(User.id == inspection.reviewed_by).first()
        info_data.append(['Reviewed By:', reviewer.username if reviewer else 'N/A'])
        if inspection.reviewed_at:
            info_data.append(['Reviewed At:', inspection.reviewed_at.strftime('%Y-%m-%d %H:%M:%S')])
    
    info_table = Table(info_data, colWidths=[2*inch, 4*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e0e7ff')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    elements.append(info_table)
    elements.append(Spacer(1, 20))
    
    # Responses Section
    responses_title = Paragraph("<b>Inspection Responses</b>", heading_style)
    elements.append(responses_title)
    elements.append(Spacer(1, 10))
    
    # Get all responses mapped by field_id
    responses_map = {resp.field_id: resp for resp in inspection.responses}
    
    # Sort fields by field_order
    sorted_fields = sorted(form.fields, key=lambda f: f.field_order)
    
    # Create responses table with questions on left and answers on right
    response_data = [['Question', 'Answer']]  # Header row
    
    for field in sorted_fields:
        field_response = responses_map.get(field.id)
        
        # Question (left column)
        question_text = field.field_name
        if field.is_required:
            question_text += " *"
        
        # Answer (right column)
        answer_text = ""
        if field_response:
            if field_response.response_value:
                # Handle signature (base64 image)
                if field.field_type == 'signature' and field_response.response_value.startswith('data:image'):
                    answer_text = "[Digital Signature]"
                # Handle photo
                elif field.field_type == 'photo':
                    answer_text = f"[Photo: {field_response.response_value}]"
                else:
                    answer_text = str(field_response.response_value)
            
            if field_response.measurement_value is not None:
                answer_text = f"{field_response.measurement_value}"
                if field.field_options and 'unit' in field.field_options:
                    answer_text += f" {field.field_options['unit']}"
            
            if field_response.pass_hold_status:
                status_text = field_response.pass_hold_status.value.upper()
                answer_text += f" [{status_text}]" if answer_text else f"[{status_text}]"
        else:
            answer_text = "—"
        
        # Add field type info for clarity
        field_type_info = f"({field.field_type})"
        
        response_data.append([
            Paragraph(f"<b>{question_text}</b><br/><font size=8 color='gray'>{field_type_info}</font>", normal_style),
            Paragraph(answer_text, normal_style)
        ])
    
    # Create the table
    response_table = Table(response_data, colWidths=[3*inch, 3.5*inch])
    response_table.setStyle(TableStyle([
        # Header row styling
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        
        # Data rows styling
        ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('ALIGN', (1, 1), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        
        # Alternating row colors for better readability
        *[('BACKGROUND', (1, i), (1, i), colors.HexColor('#ffffff') if i % 2 == 0 else colors.HexColor('#f9fafb'))
          for i in range(1, len(response_data))]
    ]))
    
    elements.append(response_table)
    
    # Add footer with generation timestamp
    elements.append(Spacer(1, 30))
    footer_text = f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} by InsPecPro"
    footer = Paragraph(f"<i>{footer_text}</i>", ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_CENTER
    ))
    elements.append(footer)
    
    # Build PDF
    doc.build(elements)
    
    # Return the PDF file
    return FileResponse(
        pdf_path,
        media_type='application/pdf',
        filename=pdf_filename,
        headers={"Content-Disposition": f"attachment; filename={pdf_filename}"}
    )
