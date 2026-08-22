from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime


class Laboratory(Base):
    """Registered laboratory entity"""
    __tablename__ = "laboratories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    code = Column(String, unique=True, index=True)
    location = Column(String)
    accreditation_number = Column(String)
    accreditation_valid_until = Column(DateTime, nullable=True)
    contact_person = Column(String)
    contact_email = Column(String)
    contact_phone = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    reports = relationship("LabReport", back_populates="laboratory")


class LabSample(Base):
    """Field sample collection record"""
    __tablename__ = "lab_samples"
    id = Column(Integer, primary_key=True, index=True)
    sample_id = Column(String, unique=True, index=True, nullable=False)  # e.g. SMP-MAS-BW-001
    water_source_id = Column(Integer, ForeignKey("water_sources.id"), nullable=False)
    sample_type = Column(String, nullable=False)  # Bacteriological, Chemical
    collection_date = Column(DateTime, nullable=False)
    collection_time = Column(String)
    collector_name = Column(String)
    collector_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    sampling_location = Column(String)
    remarks = Column(Text)
    status = Column(String, default="COLLECTED")  # COLLECTED, SENT_TO_LAB, RESULT_ENTERED

    water_source = relationship("WaterSource")
    collector = relationship("User", foreign_keys=[collector_user_id])
    reports = relationship("LabReport", back_populates="sample")


class LabReport(Base):
    """Official laboratory test report"""
    __tablename__ = "lab_reports"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String, unique=True, index=True, nullable=False)  # e.g. RPT-2024-001
    sample_id = Column(Integer, ForeignKey("lab_samples.id"), nullable=False)
    laboratory_id = Column(Integer, ForeignKey("laboratories.id"), nullable=False)
    lab_report_number = Column(String, index=True)  # Lab's own reference number
    report_date = Column(DateTime, nullable=False)
    received_date = Column(DateTime, nullable=True)
    submitted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    remarks = Column(Text)

    # Overall evaluated result
    overall_result = Column(String, nullable=True)  # FIT, UNFIT, UNSATISFACTORY
    evaluation_done = Column(Boolean, default=False)
    evaluated_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sample = relationship("LabSample", back_populates="reports")
    laboratory = relationship("Laboratory", back_populates="reports")
    submitted_by = relationship("User", foreign_keys=[submitted_by_user_id])
    result_entries = relationship("LabResultEntry", back_populates="report", cascade="all, delete-orphan")


class LabResultEntry(Base):
    """Individual parameter result within a lab report"""
    __tablename__ = "lab_result_entries"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("lab_reports.id"), nullable=False)
    parameter_id = Column(Integer, ForeignKey("parameters.id"), nullable=False)

    # Observed value - stored as string to support qualitative (DETECTED/NOT DETECTED)
    observed_value = Column(String)
    is_qualitative = Column(Boolean, default=False)  # True for coliform etc.

    # Evaluated against standard
    standard_id = Column(Integer, ForeignKey("water_quality_standards.id"), nullable=True)
    acceptable_limit = Column(String)   # snapshot at time of evaluation
    permissible_limit = Column(String)  # snapshot at time of evaluation
    parameter_status = Column(String)   # PASS, FAIL, ACCEPTABLE, NOT_TESTED

    report = relationship("LabReport", back_populates="result_entries")
    parameter = relationship("Parameter")
    standard = relationship("WaterQualityStandard")
