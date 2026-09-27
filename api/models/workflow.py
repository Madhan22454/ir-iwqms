from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime


class CorrectiveAction(Base):
    """Corrective action task automatically created on UNFIT/UNSATISFACTORY alert"""
    __tablename__ = "corrective_actions"
    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(String, unique=True, index=True, nullable=False)  # CA-2024-001
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False)
    water_source_id = Column(Integer, ForeignKey("water_sources.id"), nullable=False)

    problem_description = Column(Text)
    failed_parameters = Column(Text)  # comma-separated
    corrective_action_description = Column(Text)

    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_to_name = Column(String)
    assigned_date = Column(DateTime, default=datetime.datetime.utcnow)
    target_date = Column(DateTime, nullable=True)
    completed_date = Column(DateTime, nullable=True)

    status = Column(String, default="OPEN")
    # OPEN → ASSIGNED → IN_PROGRESS → COMPLETED → VERIFICATION_PENDING → CLOSED / ESCALATED

    remarks = Column(Text)
    evidence_description = Column(Text)  # Description of corrective steps taken
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    alert = relationship("Alert", back_populates="corrective_actions")
    water_source = relationship("WaterSource")
    assigned_to = relationship("User", foreign_keys=[assigned_to_user_id])


class RepeatSample(Base):
    """Repeat sample request after corrective action"""
    __tablename__ = "repeat_samples"
    id = Column(Integer, primary_key=True, index=True)
    repeat_sample_id = Column(String, unique=True, index=True, nullable=False)  # RS-2024-001
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False)
    original_sample_id = Column(Integer, ForeignKey("lab_samples.id"), nullable=True)
    water_source_id = Column(Integer, ForeignKey("water_sources.id"), nullable=False)

    scheduled_date = Column(DateTime, nullable=True)
    collection_date = Column(DateTime, nullable=True)
    collector_name = Column(String)
    laboratory_id = Column(Integer, ForeignKey("laboratories.id"), nullable=True)

    # Linked repeat report (after collection and analysis)
    repeat_report_id = Column(Integer, ForeignKey("lab_reports.id"), nullable=True)
    repeat_result = Column(String, nullable=True)  # FIT, UNFIT, UNSATISFACTORY

    status = Column(String, default="DUE")
    # DUE → COLLECTED → RESULT_ENTERED → VERIFICATION_PENDING → VERIFIED

    remarks = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    alert = relationship("Alert", back_populates="repeat_samples")
    original_sample = relationship("LabSample", foreign_keys=[original_sample_id])
    water_source = relationship("WaterSource")
    laboratory = relationship("Laboratory")
    repeat_report = relationship("LabReport", foreign_keys=[repeat_report_id])


class Verification(Base):
    """Mandatory verification step before alert can be closed"""
    __tablename__ = "verifications"
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False)
    verified_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    verification_date = Column(DateTime, default=datetime.datetime.utcnow)
    repeat_result = Column(String)  # FIT / UNFIT / UNSATISFACTORY
    remarks = Column(Text)
    supporting_document_description = Column(Text)
    decision = Column(String, nullable=False)  # CLOSE / ESCALATE
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    alert = relationship("Alert", back_populates="verifications")
    verified_by = relationship("User", foreign_keys=[verified_by_user_id])


class EscalationRule(Base):
    """Configurable escalation rules"""
    __tablename__ = "escalation_rules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    alert_type = Column(String, default="WATER_QUALITY")
    severity = Column(String)       # CRITICAL, HIGH, MEDIUM
    level = Column(Integer, default=1)     # 1=Division, 2=Zone, 3=Central
    delay_hours = Column(Integer, default=48)  # hours after alert created before escalation
    escalate_to_role = Column(String)   # UserRole to notify
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
