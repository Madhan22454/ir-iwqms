from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from database import Base
import datetime


class OfficerResponsibility(Base):
    """Maps users (officers) to water sources they are responsible for"""
    __tablename__ = "officer_responsibilities"
    id = Column(Integer, primary_key=True, index=True)
    water_source_id = Column(Integer, ForeignKey("water_sources.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)  # mirrors UserRole
    is_active = Column(Boolean, default=True)

    water_source = relationship("WaterSource")
    user = relationship("User")


class Alert(Base):
    """Critical water quality alert generated automatically on UNFIT/UNSATISFACTORY result"""
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String, unique=True, index=True, nullable=False)  # e.g. ALT-2024-001
    alert_type = Column(String, default="WATER_QUALITY")
    severity = Column(String, nullable=False)  # CRITICAL, HIGH, MEDIUM

    # Links
    lab_report_id = Column(Integer, ForeignKey("lab_reports.id"), nullable=False)
    water_source_id = Column(Integer, ForeignKey("water_sources.id"), nullable=False)

    # Denormalized for quick display
    source_id_code = Column(String)
    zone_name = Column(String)
    division_name = Column(String)
    station_name = Column(String)
    source_type = Column(String)

    # Result summary
    sample_result = Column(String)  # UNFIT / UNSATISFACTORY
    sample_date = Column(DateTime)
    report_date = Column(DateTime)
    lab_name = Column(String)
    failed_parameters = Column(JSON)  # list of {name, observed, limit, status}
    remarks = Column(Text)

    # Workflow status
    status = Column(String, default="OPEN")
    # OPEN → ACKNOWLEDGED → CORRECTIVE_ACTION → REPEAT_SAMPLE → VERIFICATION → CLOSED / ESCALATED

    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledgement_remarks = Column(Text)
    closed_at = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)  # SLA deadline

    # Escalation
    is_escalated = Column(Boolean, default=False)
    escalation_level = Column(Integer, default=0)
    escalated_at = Column(DateTime, nullable=True)

    lab_report = relationship("LabReport")
    water_source = relationship("WaterSource")
    acknowledged_by = relationship("User", foreign_keys=[acknowledged_by_user_id])
    notifications = relationship("AlertNotification", back_populates="alert", cascade="all, delete-orphan")
    corrective_actions = relationship("CorrectiveAction", back_populates="alert")
    repeat_samples = relationship("RepeatSample", back_populates="alert")
    verifications = relationship("Verification", back_populates="alert")


class AlertNotification(Base):
    """Notification record for each officer when an alert is raised"""
    __tablename__ = "alert_notifications"
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_name = Column(String)
    recipient_role = Column(String)
    recipient_email = Column(String)
    notification_type = Column(String, default="EMAIL")
    status = Column(String, default="SIMULATED")  # PENDING, SENT, FAILED, SIMULATED
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    alert = relationship("Alert", back_populates="notifications")
    user = relationship("User")
