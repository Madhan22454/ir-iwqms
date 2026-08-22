from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# --- Corrective Action ---
class CorrectiveActionBase(BaseModel):
    alert_id: int
    water_source_id: int
    problem_description: Optional[str] = None
    failed_parameters: Optional[str] = None
    corrective_action_description: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_to_user_id: Optional[int] = None
    target_date: Optional[datetime] = None
    remarks: Optional[str] = None

class CorrectiveActionCreate(CorrectiveActionBase):
    pass

class CorrectiveActionUpdate(BaseModel):
    corrective_action_description: Optional[str] = None
    assigned_to_user_id: Optional[int] = None
    assigned_to_name: Optional[str] = None
    target_date: Optional[datetime] = None
    status: Optional[str] = None
    remarks: Optional[str] = None
    evidence_description: Optional[str] = None
    completed_date: Optional[datetime] = None

class CorrectiveActionOut(BaseModel):
    id: int
    action_id: str
    alert_id: int
    water_source_id: int
    problem_description: Optional[str]
    failed_parameters: Optional[str]
    corrective_action_description: Optional[str]
    assigned_to_name: Optional[str]
    status: str
    target_date: Optional[datetime]
    completed_date: Optional[datetime]
    remarks: Optional[str]
    evidence_description: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True


# --- Repeat Sample ---
class RepeatSampleCreate(BaseModel):
    alert_id: int
    water_source_id: int
    scheduled_date: Optional[datetime] = None
    collector_name: Optional[str] = None
    laboratory_id: Optional[int] = None
    remarks: Optional[str] = None

class RepeatSampleUpdate(BaseModel):
    collection_date: Optional[datetime] = None
    collector_name: Optional[str] = None
    laboratory_id: Optional[int] = None
    repeat_report_id: Optional[int] = None
    repeat_result: Optional[str] = None
    status: Optional[str] = None
    remarks: Optional[str] = None

class RepeatSampleOut(BaseModel):
    id: int
    repeat_sample_id: str
    alert_id: int
    water_source_id: int
    scheduled_date: Optional[datetime]
    collection_date: Optional[datetime]
    collector_name: Optional[str]
    repeat_result: Optional[str]
    status: str
    remarks: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True


# --- Verification ---
class VerificationCreate(BaseModel):
    alert_id: int
    repeat_result: str
    remarks: Optional[str] = None
    supporting_document_description: Optional[str] = None
    decision: str   # CLOSE / ESCALATE

class VerificationOut(BaseModel):
    id: int
    alert_id: int
    repeat_result: str
    remarks: Optional[str]
    decision: str
    verification_date: datetime
    class Config:
        from_attributes = True


# --- Escalation Rule ---
class EscalationRuleCreate(BaseModel):
    name: str
    alert_type: str = "WATER_QUALITY"
    severity: Optional[str] = "CRITICAL"
    level: int = 1
    delay_hours: int = 48
    escalate_to_role: Optional[str] = None
    is_active: bool = True

class EscalationRuleOut(BaseModel):
    id: int
    name: str
    alert_type: str
    severity: Optional[str]
    level: int
    delay_hours: int
    escalate_to_role: Optional[str]
    is_active: bool
    class Config:
        from_attributes = True
