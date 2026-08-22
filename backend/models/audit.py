from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime


class AuditLog(Base):
    """Immutable audit trail for all significant system events"""
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_name = Column(String)   # denormalized snapshot
    user_role = Column(String)
    action = Column(String, nullable=False, index=True)
    # e.g. LOGIN, RESULT_CREATED, ALERT_CREATED, ALERT_ACKNOWLEDGED,
    #       CORRECTIVE_ACTION_CREATED, REPEAT_SAMPLE_CREATED, VERIFICATION_COMPLETED,
    #       ALERT_CLOSED, ALERT_ESCALATED, NOTIFICATION_SENT
    entity_type = Column(String)   # Alert, LabReport, CorrectiveAction, etc.
    entity_id = Column(Integer, nullable=True)
    entity_ref = Column(String)    # human-readable ref (e.g. ALT-2024-001)
    details = Column(Text)         # JSON string with extra context
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", foreign_keys=[user_id])
