from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# --- Laboratory ---
class LaboratoryBase(BaseModel):
    name: str
    code: str
    location: Optional[str] = None
    accreditation_number: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    is_active: bool = True

class LaboratoryCreate(LaboratoryBase):
    pass

class Laboratory(LaboratoryBase):
    id: int
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


# --- Lab Sample ---
class LabSampleBase(BaseModel):
    sample_id: str
    water_source_id: int
    sample_type: str       # Bacteriological / Chemical
    collection_date: datetime
    collection_time: Optional[str] = None
    collector_name: Optional[str] = None
    sampling_location: Optional[str] = None
    remarks: Optional[str] = None

class LabSampleCreate(LabSampleBase):
    pass

class LabSample(LabSampleBase):
    id: int
    status: str
    class Config:
        from_attributes = True


# --- Result Entry (per parameter) ---
class ResultEntryItem(BaseModel):
    parameter_id: int
    observed_value: str
    is_qualitative: bool = False


# --- Lab Report Create ---
class LabReportCreate(BaseModel):
    report_id: Optional[str] = None      # auto-generated if not provided
    sample_id: int
    laboratory_id: int
    lab_report_number: str
    report_date: datetime
    received_date: Optional[datetime] = None
    remarks: Optional[str] = None
    result_entries: List[ResultEntryItem]


class LabReportResponse(BaseModel):
    id: int
    report_id: str
    sample_id: int
    laboratory_id: int
    lab_report_number: str
    report_date: datetime
    overall_result: Optional[str] = None
    evaluation_done: bool
    evaluated_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class EvaluationResponse(BaseModel):
    report_id: str
    overall_result: str
    evaluation_summary: str
    parameter_results: List[dict]
    failed_parameters: List[dict]
    alert_created: bool
    alert_id: Optional[str] = None
    corrective_action_id: Optional[str] = None
    repeat_sample_id: Optional[str] = None
    officers_notified: int
