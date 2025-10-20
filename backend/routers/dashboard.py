from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Dict, Any
from datetime import datetime, timedelta

from database import get_db
from models import User, Inspection, Form
from schemas import DashboardStats, AnalyticsResponse, AnalyticsData, InspectionStatus
from auth import get_current_user

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics based on user role"""
    query = db.query(Inspection)
    
    # Filter based on user role
    if current_user.role.value == "user":
        query = query.filter(Inspection.inspector_id == current_user.id)
    
    # Get counts by status
    total_inspections = query.count()
    submitted_inspections = query.filter(Inspection.status == InspectionStatus.submitted).count()
    accepted_inspections = query.filter(Inspection.status == InspectionStatus.accepted).count()
    rejected_inspections = query.filter(Inspection.status == InspectionStatus.rejected).count()
    draft_inspections = query.filter(Inspection.status == InspectionStatus.draft).count()
    
    # Get total forms count
    total_forms = db.query(Form).filter(Form.is_active == True).count()
    
    return DashboardStats(
        total_inspections=total_inspections,
        submitted_inspections=submitted_inspections,
        accepted_inspections=accepted_inspections,
        rejected_inspections=rejected_inspections,
        draft_inspections=draft_inspections,
        total_forms=total_forms
    )

@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics data (Supervisor, Management and Admin roles)"""
    if current_user.role.value not in ["supervisor", "management", "admin"]:
        return AnalyticsResponse(
            daily_inspections=[],
            monthly_inspections=[],
            inspection_by_status=[],
            inspection_by_plant=[]
        )
    
    # Daily inspections for the last 30 days
    thirty_days_ago = datetime.now() - timedelta(days=30)
    daily_data = db.query(
        func.date(Inspection.created_at).label('date'),
        func.count(Inspection.id).label('count')
    ).filter(
        Inspection.created_at >= thirty_days_ago
    ).group_by(
        func.date(Inspection.created_at)
    ).all()
    
    daily_inspections = [
        AnalyticsData(date=str(item.date), count=item.count)
        for item in daily_data
    ]
    
    # Monthly inspections for the last 12 months
    twelve_months_ago = datetime.now() - timedelta(days=365)
    monthly_data = db.query(
        extract('year', Inspection.created_at).label('year'),
        extract('month', Inspection.created_at).label('month'),
        func.count(Inspection.id).label('count')
    ).filter(
        Inspection.created_at >= twelve_months_ago
    ).group_by(
        extract('year', Inspection.created_at),
        extract('month', Inspection.created_at)
    ).all()
    
    monthly_inspections = [
        AnalyticsData(date=f"{int(item.year)}-{int(item.month):02d}", count=item.count)
        for item in monthly_data
    ]
    
    # Inspections by status
    status_data = db.query(
        Inspection.status,
        func.count(Inspection.id).label('count')
    ).group_by(Inspection.status).all()
    
    inspection_by_status = [
        {"status": item.status.value, "count": item.count}
        for item in status_data
    ]
    
    # Inspections by plant
    plant_data = db.query(
        User.plant,
        func.count(Inspection.id).label('count')
    ).join(
        Inspection, User.id == Inspection.inspector_id
    ).filter(
        User.plant.isnot(None)
    ).group_by(User.plant).all()
    
    inspection_by_plant = [
        {"plant": item.plant, "count": item.count}
        for item in plant_data
    ]
    
    return AnalyticsResponse(
        daily_inspections=daily_inspections,
        monthly_inspections=monthly_inspections,
        inspection_by_status=inspection_by_status,
        inspection_by_plant=inspection_by_plant
    )

@router.get("/recent-inspections")
async def get_recent_inspections(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent inspections"""
    query = db.query(Inspection)
    
    # Filter based on user role
    if current_user.role.value == "user":
        query = query.filter(Inspection.inspector_id == current_user.id)
    
    recent_inspections = query.order_by(
        Inspection.created_at.desc()
    ).limit(limit).all()
    
    return recent_inspections

@router.get("/pending-reviews")
async def get_pending_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get inspections pending review (Supervisor/Management only)"""
    if current_user.role.value not in ["supervisor", "management", "admin"]:
        return []
    
    pending_inspections = db.query(Inspection).filter(
        Inspection.status == InspectionStatus.submitted
    ).order_by(Inspection.created_at.desc()).all()
    
    return pending_inspections

@router.get("/forms-summary")
async def get_forms_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get summary of forms and their usage"""
    if current_user.role.value not in ["admin", "management"]:
        return []
    
    forms_with_counts = db.query(
        Form.id,
        Form.form_name,
        Form.created_at,
        func.count(Inspection.id).label('inspection_count')
    ).outerjoin(
        Inspection, Form.id == Inspection.form_id
    ).filter(
        Form.is_active == True
    ).group_by(
        Form.id, Form.form_name, Form.created_at
    ).all()
    
    return [
        {
            "form_id": item.id,
            "form_name": item.form_name,
            "created_at": item.created_at,
            "inspection_count": item.inspection_count
        }
        for item in forms_with_counts
    ]