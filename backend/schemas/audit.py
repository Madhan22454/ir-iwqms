from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AuditLogOut(BaseModel):
    id: int
    user_name: Optional[str]
    user_role: Optional[str]
    action: str
    entity_type: Optional[str]
    entity_id: Optional[int]
    entity_ref: Optional[str]
    details: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True
