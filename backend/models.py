from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, ForeignKey, DECIMAL, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

Base = declarative_base()

class UserRole(enum.Enum):
    admin = "admin"
    user = "user"
    supervisor = "supervisor"
    management = "management"

class InspectionStatus(enum.Enum):
    draft = "draft"
    submitted = "submitted"
    accepted = "accepted"
    rejected = "rejected"

class FieldType(enum.Enum):
    text = "text"
    dropdown = "dropdown"
    search_dropdown = "search_dropdown"
    button = "button"
    photo = "photo"
    signature = "signature"
    measurement = "measurement"
    notes = "notes"
    date = "date"
    datetime = "datetime"
    time = "time"
    subform = "subform"

class MeasurementType(enum.Enum):
    between = "between"
    higher = "higher"
    lower = "lower"

class PassHoldStatus(str, enum.Enum):
    pass_value = "pass"
    hold = "hold"

class FileType(enum.Enum):
    photo = "photo"
    signature = "signature"

class User(Base):
    __tablename__ = "inspecpro_users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(50), unique=True, nullable=False)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    plant = Column(String(100))
    line_process = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    created_forms = relationship("Form", back_populates="creator")
    inspections = relationship("Inspection", foreign_keys="Inspection.inspector_id", back_populates="inspector")
    reviewed_inspections = relationship("Inspection", foreign_keys="Inspection.reviewed_by", back_populates="reviewer")

class Form(Base):
    __tablename__ = "forms"
    
    id = Column(Integer, primary_key=True, index=True)
    form_name = Column(String(255), nullable=False)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("inspecpro_users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    creator = relationship("User", back_populates="created_forms")
    fields = relationship("FormField", back_populates="form")
    inspections = relationship("Inspection", back_populates="form")

class FormField(Base):
    __tablename__ = "form_fields"
    
    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False)
    field_name = Column(String(255), nullable=False)
    field_type = Column(Enum(FieldType), nullable=False)
    field_types = Column(JSON)  # Multiple field types support
    field_options = Column(JSON)
    placeholder_text = Column(Text)  # For notes/instructions
    measurement_type = Column(Enum(MeasurementType))
    measurement_min = Column(DECIMAL(10, 2))
    measurement_max = Column(DECIMAL(10, 2))
    is_required = Column(Boolean, default=False)
    field_order = Column(Integer, nullable=False)
    flag_conditions = Column(JSON)  # Flag condition settings for abnormal data detection
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    form = relationship("Form", back_populates="fields")
    responses = relationship("InspectionResponse", back_populates="field")
    files = relationship("InspectionFile", back_populates="field")

class Inspection(Base):
    __tablename__ = "inspections"
    
    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False)
    inspector_id = Column(Integer, ForeignKey("inspecpro_users.id"), nullable=False)
    status = Column(Enum(InspectionStatus), default=InspectionStatus.draft)
    reviewed_by = Column(Integer, ForeignKey("inspecpro_users.id"))
    reviewed_at = Column(DateTime(timezone=True))
    rejection_reason = Column(Text)
    reviewer_signature = Column(Text)  # Base64 encoded signature image
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    form = relationship("Form", back_populates="inspections")
    inspector = relationship("User", foreign_keys=[inspector_id], back_populates="inspections")
    reviewer = relationship("User", foreign_keys=[reviewed_by], back_populates="reviewed_inspections")
    responses = relationship("InspectionResponse", back_populates="inspection")
    files = relationship("InspectionFile", back_populates="inspection")

class InspectionResponse(Base):
    __tablename__ = "inspection_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    field_id = Column(Integer, ForeignKey("form_fields.id"), nullable=True)  # Allow NULL for conditional fields
    response_value = Column(Text)
    measurement_value = Column(DECIMAL(10, 2))
    pass_hold_status = Column(String(10))  # Store as string: 'pass' or 'hold'
    is_flagged = Column(Boolean, default=False)  # Flag for abnormal data detection
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    inspection = relationship("Inspection", back_populates="responses")
    field = relationship("FormField", back_populates="responses")

class InspectionFile(Base):
    __tablename__ = "inspection_files"
    
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    field_id = Column(Integer, ForeignKey("form_fields.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(Enum(FileType), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    inspection = relationship("Inspection", back_populates="files")
    field = relationship("FormField", back_populates="files")

class PasswordReset(Base):
    __tablename__ = "password_resets"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False)
    token = Column(String(255), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
