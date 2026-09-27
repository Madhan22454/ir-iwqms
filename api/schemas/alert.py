from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class AlertNotificationOut(BaseModel):
    id: int
    recipient_name: Optional[str]
    recipient_role: Optional[str]
    recipient_email: Optional[str]
    status: str
    sent_at: Optional[datetime]
    class Config:
        from_attributes = True


class AlertListItem(BaseModel):
    id: int
    alert_id: str
    severity: str
    source_id_code: Optional[str]
    zone_name: Optional[str]
    division_name: Optional[str]
    station_name: Optional[str]
    source_type: Optional[str]
    sample_result: Optional[str]
    sample_date: Optional[datetime]
    report_date: Optional[datetime]
    status: str
    created_at: datetime
    due_date: Optional[datetime]
    is_escalated: bool
    class Config:
        from_attributes = True


class AlertDetail(AlertListItem):
    lab_name: Optional[str]
    failed_parameters: Optional[Any]
    remarks: Optional[str]
    acknowledged_at: Optional[datetime]
    acknowledgement_remarks: Optional[str]
    closed_at: Optional[datetime]
    escalation_level: int
    notifications: List[AlertNotificationOut] = []
    class Config:
        from_attributes = True


class AcknowledgeRequest(BaseModel):
    remarks: Optional[str] = None


class OfficerResponsibilityCreate(BaseModel):
    water_source_id: int
    user_id: int
    role: str

class OfficerResponsibilityOut(BaseModel):
    id: int
    water_source_id: int
    user_id: int
    role: str
    is_active: bool
    class Config:
        from_attributes = True
