from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    admin = "admin"
    user = "user"
    supervisor = "supervisor"
    management = "management"

class InspectionStatus(str, Enum):
    draft = "draft"
    submitted = "submitted"
    accepted = "accepted"
    rejected = "rejected"

class FieldType(str, Enum):
    text = "text"
    dropdown = "dropdown"
    search_dropdown = "search_dropdown"
    button = "button"
    photo = "photo"
    signature = "signature"
    measurement = "measurement"
    notes = "notes"

class MeasurementType(str, Enum):
    between = "between"
    higher = "higher"
    lower = "lower"

class PassHoldStatus(str, Enum):
    pass_value = "pass"
    hold = "hold"

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: UserRole
    plant: Optional[str] = None
    line_process: Optional[str] = None

class UserCreate(UserBase):
    password: str
    user_id: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    plant: Optional[str] = None
    line_process: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    user_id: str
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# Form Schemas
class FormFieldBase(BaseModel):
    field_name: str
    field_type: FieldType
    field_options: Optional[Dict[str, Any]] = None
    measurement_type: Optional[MeasurementType] = None
    measurement_min: Optional[float] = None
    measurement_max: Optional[float] = None
    is_required: bool = False
    field_order: int

class FormFieldCreate(FormFieldBase):
    pass

class FormFieldResponse(FormFieldBase):
    id: int
    form_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class FormBase(BaseModel):
    form_name: str
    description: Optional[str] = None

class FormCreate(FormBase):
    fields: List[FormFieldCreate] = []

class FormUpdate(BaseModel):
    form_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class FormResponse(FormBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    is_active: bool
    fields: List[FormFieldResponse] = []

    class Config:
        from_attributes = True

# Inspection Schemas
class InspectionResponseBase(BaseModel):
    field_id: int
    response_value: Optional[str] = None
    measurement_value: Optional[float] = None
    pass_hold_status: Optional[PassHoldStatus] = None

class InspectionResponseCreate(InspectionResponseBase):
    pass

class InspectionResponseResponse(InspectionResponseBase):
    id: int
    inspection_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class InspectionBase(BaseModel):
    form_id: int

class InspectionCreate(InspectionBase):
    responses: List[InspectionResponseCreate] = []

class InspectionUpdate(BaseModel):
    status: Optional[InspectionStatus] = None
    rejection_reason: Optional[str] = None

class InspectionResponse(InspectionBase):
    id: int
    inspector_id: int
    status: InspectionStatus
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    responses: List[InspectionResponseResponse] = []

    class Config:
        from_attributes = True

# Dashboard Schemas
class DashboardStats(BaseModel):
    total_inspections: int
    submitted_inspections: int
    accepted_inspections: int
    rejected_inspections: int
    draft_inspections: int

class AnalyticsData(BaseModel):
    date: str
    count: int

class AnalyticsResponse(BaseModel):
    daily_inspections: List[AnalyticsData]
    monthly_inspections: List[AnalyticsData]
    inspection_by_status: List[Dict[str, Any]]
    inspection_by_plant: List[Dict[str, Any]]