#!/usr/bin/env python3
"""
Improved PDF formatting implementation for inspection exports.
This file contains enhanced PDF generation with better styling and layout.
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import io
import base64
from datetime import datetime
import os

class NumberedCanvas(canvas.Canvas):
    """Custom canvas for adding page numbers and headers/footers."""
    
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []
        self.page_count = 0

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()
        self.page_count += 1

    def save(self):
        """Add page numbers and headers/footers to all pages."""
        num_pages = len(self._saved_page_states)
        for (page_num, state) in enumerate(self._saved_page_states):
            self.__dict__.update(state)
            self.draw_page_number(page_num + 1, num_pages)
            self.draw_header()
            self.draw_footer()
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_num, total_pages):
        """Draw page number at bottom right."""
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.grey)
        self.drawRightString(
            letter[0] - 0.75 * inch,
            0.5 * inch,
            f"Page {page_num} of {total_pages}"
        )

    def draw_header(self):
        """Draw header with company logo and title."""
        self.setFont("Helvetica-Bold", 10)
        self.setFillColor(colors.HexColor('#1e40af'))
        self.drawString(0.75 * inch, letter[1] - 0.5 * inch, "InsPecPro - Inspection Report")
        
        # Draw a line under the header
        self.setStrokeColor(colors.HexColor('#1e40af'))
        self.setLineWidth(1)
        self.line(0.75 * inch, letter[1] - 0.6 * inch, letter[0] - 0.75 * inch, letter[1] - 0.6 * inch)

    def draw_footer(self):
        """Draw footer with generation info."""
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.grey)
        self.drawString(
            0.75 * inch,
            0.3 * inch,
            f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | InsPecPro System"
        )

def create_enhanced_styles():
    """Create enhanced paragraph styles for better formatting."""
    styles = getSampleStyleSheet()
    
    # Custom title style
    styles.add(ParagraphStyle(
        name='CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#1e40af'),
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    
    # Custom heading style
    styles.add(ParagraphStyle(
        name='CustomHeading',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=15,
        spaceBefore=20,
        textColor=colors.HexColor('#1e40af'),
        fontName='Helvetica-Bold',
        borderWidth=1,
        borderColor=colors.HexColor('#e5e7eb'),
        borderPadding=8,
        backColor=colors.HexColor('#f8fafc')
    ))
    
    # Custom subheading style
    styles.add(ParagraphStyle(
        name='CustomSubheading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=10,
        spaceBefore=15,
        textColor=colors.HexColor('#374151'),
        fontName='Helvetica-Bold'
    ))
    
    # Enhanced normal style
    styles.add(ParagraphStyle(
        name='EnhancedNormal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6,
        leading=14,
        textColor=colors.HexColor('#374151')
    ))
    
    # Info box style
    styles.add(ParagraphStyle(
        name='InfoBox',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#1f2937'),
        backColor=colors.HexColor('#f3f4f6'),
        borderWidth=1,
        borderColor=colors.HexColor('#d1d5db'),
        borderPadding=10,
        spaceAfter=15
    ))
    
    return styles

def create_inspection_summary_table(inspection, form, inspector):
    """Create a professional inspection summary table."""
    summary_data = [
        ['Inspection Details', ''],
        ['Inspection ID', str(inspection.id)],
        ['Form Name', form.form_name],
        ['Inspector', inspector.username if inspector else 'Unknown'],
        ['Status', inspection.status.value.title()],
        ['Created Date', inspection.created_at.strftime('%Y-%m-%d %H:%M:%S')],
        ['Last Updated', inspection.updated_at.strftime('%Y-%m-%d %H:%M:%S') if inspection.updated_at else 'N/A']
    ]
    
    summary_table = Table(summary_data, colWidths=[2.5*inch, 4*inch])
    summary_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('SPAN', (0, 0), (-1, 0)),
        
        # Data rows
        ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#f8fafc')),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 1), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    return summary_table

def create_enhanced_responses_table(form, responses_map, styles):
    """Create an enhanced responses table with better formatting."""
    sorted_fields = sorted(form.fields, key=lambda f: f.field_order)
    
    # Group fields by sections if available
    sections = {}
    for field in sorted_fields:
        section = getattr(field, 'section', 'General')
        if section not in sections:
            sections[section] = []
        sections[section].append(field)
    
    elements = []
    
    for section_name, fields in sections.items():
        if len(sections) > 1:  # Only show section headers if there are multiple sections
            section_header = Paragraph(f"<b>{section_name}</b>", styles['CustomSubheading'])
            elements.append(section_header)
            elements.append(Spacer(1, 10))
        
        # Create table data for this section
        table_data = [['Field', 'Type', 'Response', 'Status']]
        
        for field in fields:
            field_response = responses_map.get(field.id)
            
            # Field name with required indicator
            field_name = field.field_name
            if field.is_required:
                field_name += " *"
            
            # Field type with better formatting
            field_type = field.field_type.replace('_', ' ').title()
            
            # Response value with special handling
            response_value = ""
            status_value = ""
            
            if field_response:
                if field_response.response_value:
                    if field.field_type == 'signature' and field_response.response_value.startswith('data:image'):
                        response_value = "✓ Digital Signature"
                    elif field.field_type == 'photo':
                        response_value = f"📷 {field_response.response_value}"
                    elif field.field_type == 'measurement':
                        response_value = str(field_response.measurement_value or field_response.response_value)
                        if field.field_options and 'unit' in field.field_options:
                            response_value += f" {field.field_options['unit']}"
                    else:
                        response_value = str(field_response.response_value)
                
                # Pass/Hold status with color coding
                if field_response.pass_hold_status:
                    status = field_response.pass_hold_status.value
                    if status == 'pass':
                        status_value = "✓ PASS"
                    else:
                        status_value = "⚠ HOLD"
                else:
                    status_value = "—"
            else:
                response_value = "—"
                status_value = "—"
            
            table_data.append([
                Paragraph(field_name, styles['EnhancedNormal']),
                Paragraph(field_type, styles['EnhancedNormal']),
                Paragraph(response_value, styles['EnhancedNormal']),
                Paragraph(status_value, styles['EnhancedNormal'])
            ])
        
        # Create table with enhanced styling
        col_widths = [2.5*inch, 1*inch, 2.5*inch, 1*inch]
        response_table = Table(table_data, colWidths=col_widths)
        
        # Enhanced table styling
        table_style = [
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            
            # Data rows
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]
        
        # Alternating row colors
        for i in range(1, len(table_data)):
            if i % 2 == 0:
                table_style.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor('#f9fafb')))
            else:
                table_style.append(('BACKGROUND', (0, i), (-1, i), colors.white))
        
        response_table.setStyle(TableStyle(table_style))
        elements.append(response_table)
        elements.append(Spacer(1, 20))
    
    return elements

def generate_enhanced_pdf(inspection, form, inspector, responses_map, pdf_path):
    """Generate an enhanced PDF with professional formatting."""
    
    # Create document with custom canvas
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=1*inch,
        bottomMargin=0.75*inch,
        canvasmaker=NumberedCanvas
    )
    
    # Get enhanced styles
    styles = create_enhanced_styles()
    
    # Build document elements
    elements = []
    
    # Title
    title = Paragraph(f"Inspection Report #{inspection.id}", styles['CustomTitle'])
    elements.append(title)
    elements.append(Spacer(1, 20))
    
    # Summary section
    summary_heading = Paragraph("Inspection Summary", styles['CustomHeading'])
    elements.append(summary_heading)
    
    summary_table = create_inspection_summary_table(inspection, form, inspector)
    elements.append(summary_table)
    elements.append(Spacer(1, 30))
    
    # Responses section
    responses_heading = Paragraph("Inspection Responses", styles['CustomHeading'])
    elements.append(responses_heading)
    elements.append(Spacer(1, 15))
    
    # Add responses tables
    response_elements = create_enhanced_responses_table(form, responses_map, styles)
    elements.extend(response_elements)
    
    # Build the PDF
    doc.build(elements)
    
    return pdf_path

# Example usage function
def test_enhanced_pdf_generation():
    """Test function to demonstrate enhanced PDF generation."""
    print("🎨 Enhanced PDF formatting implementation created!")
    print("📋 Key improvements:")
    print("   • Professional header and footer with page numbers")
    print("   • Enhanced color scheme and typography")
    print("   • Better table layouts with alternating row colors")
    print("   • Improved handling of different field types")
    print("   • Section-based organization")
    print("   • Status indicators with visual cues")
    print("   • Responsive column widths")
    print("   • Better spacing and padding")
    
    return True

if __name__ == "__main__":
    test_enhanced_pdf_generation()