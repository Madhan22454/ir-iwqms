"""
Laboratory API — manages laboratories, sample entries, report submission, and evaluation.
The CORE of the system: submitting a report triggers automatic evaluation and alert engine.
"""
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from api.deps import get_db, CurrentUser
from models.lab import Laboratory, LabSample, LabReport, LabResultEntry
from models.master import Parameter, WaterQualityStandard
from models.audit import AuditLog
from schemas.lab import (
    LaboratoryCreate, Laboratory as LabSchema,
    LabSampleCreate, LabSample as SampleSchema,
    LabReportCreate, LabReportResponse, EvaluationResponse,
)
from services.evaluation import evaluate_report
from services.alert_engine import trigger_alert_engine, get_concerned_officers

router = APIRouter()

# ── Utility ───────────────────────────────────────────────────────────────────

def _gen_report_id(db: Session) -> str:
    count = db.query(LabReport).count() + 1
    year = datetime.datetime.utcnow().year
    return f"RPT-{year}-{count:04d}"

def _gen_sample_id_auto(db: Session, source_code: str) -> str:
    count = db.query(LabSample).count() + 1
    year = datetime.datetime.utcnow().year
    return f"SMP-{source_code}-{year}-{count:04d}"

def _audit(db: Session, user, action: str, entity_type: str, entity_id: int, ref: str, details: str):
    log = AuditLog(
        user_id=user.id if user else None,
        user_name=user.name if user else "SYSTEM",
        user_role=user.role if user else "SYSTEM",
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_ref=ref,
        details=details,
    )
    db.add(log)
    db.commit()

# ── Laboratory CRUD ───────────────────────────────────────────────────────────

@router.get("/laboratories/", response_model=List[LabSchema])
def list_labs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Laboratory).offset(skip).limit(limit).all()

@router.post("/laboratories/", response_model=LabSchema)
def create_lab(lab: LaboratoryCreate, db: Session = Depends(get_db), current_user: CurrentUser = None):
    db_lab = Laboratory(**lab.model_dump())
    db.add(db_lab)
    db.commit()
    db.refresh(db_lab)
    return db_lab

# ── Sample Entry ──────────────────────────────────────────────────────────────

@router.get("/samples/", response_model=List[SampleSchema])
def list_samples(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(LabSample).offset(skip).limit(limit).all()

@router.post("/samples/", response_model=SampleSchema)
def create_sample(sample: LabSampleCreate, db: Session = Depends(get_db), current_user: CurrentUser = None):
    # Idempotency: check for duplicate sample_id
    existing = db.query(LabSample).filter(LabSample.sample_id == sample.sample_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Sample ID '{sample.sample_id}' already exists")
    db_sample = LabSample(**sample.model_dump())
    db.add(db_sample)
    db.commit()
    db.refresh(db_sample)
    _audit(db, current_user, "SAMPLE_CREATED", "LabSample", db_sample.id,
           db_sample.sample_id, f"Sample created for source {sample.water_source_id}")
    return db_sample

# ── Report Submission + Auto-Evaluation ──────────────────────────────────────

@router.get("/reports/", response_model=List[LabReportResponse])
def list_reports(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(LabReport).order_by(LabReport.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/reports/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(LabReport).filter(LabReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    entries = []
    for entry in report.result_entries:
        param = db.query(Parameter).filter(Parameter.id == entry.parameter_id).first()
        std = db.query(WaterQualityStandard).filter(
            WaterQualityStandard.parameter_id == entry.parameter_id,
            WaterQualityStandard.is_active == True,
        ).first()
        entries.append({
            "parameter_id": entry.parameter_id,
            "parameter_name": param.name if param else str(entry.parameter_id),
            "unit": param.unit if param else "",
            "observed_value": entry.observed_value,
            "is_qualitative": entry.is_qualitative,
            "status": entry.parameter_status,
            "acceptable_limit": entry.acceptable_limit,
            "permissible_limit": entry.permissible_limit,
        })

    sample = report.sample
    return {
        "id": report.id,
        "report_id": report.report_id,
        "lab_report_number": report.lab_report_number,
        "report_date": report.report_date,
        "overall_result": report.overall_result,
        "evaluation_done": report.evaluation_done,
        "evaluated_at": report.evaluated_at,
        "created_at": report.created_at,
        "sample": {
            "sample_id": sample.sample_id if sample else None,
            "water_source_id": sample.water_source_id if sample else None,
            "sample_type": sample.sample_type if sample else None,
            "collection_date": sample.collection_date if sample else None,
            "collector_name": sample.collector_name if sample else None,
        } if sample else None,
        "result_entries": entries,
    }

@router.post("/reports/", response_model=EvaluationResponse)
def submit_report(
    report_in: LabReportCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None,
):
    """
    Submit a lab report with parameter results.
    Automatically evaluates and triggers alert if UNFIT/UNSATISFACTORY.
    """
    # Validate sample exists
    sample = db.query(LabSample).filter(LabSample.id == report_in.sample_id).first()
    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")

    # Validate lab exists
    lab = db.query(Laboratory).filter(Laboratory.id == report_in.laboratory_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratory not found")

    # Idempotency: prevent duplicate report for same sample + lab report number
    existing = db.query(LabReport).filter(
        LabReport.sample_id == report_in.sample_id,
        LabReport.lab_report_number == report_in.lab_report_number,
    ).first()
    if existing:
        raise HTTPException(status_code=409,
                            detail=f"Report with lab report number '{report_in.lab_report_number}' "
                                   f"for this sample already exists (Report ID: {existing.report_id})")

    # Generate report ID
    report_id = report_in.report_id or _gen_report_id(db)

    # Create report
    report = LabReport(
        report_id=report_id,
        sample_id=report_in.sample_id,
        laboratory_id=report_in.laboratory_id,
        lab_report_number=report_in.lab_report_number,
        report_date=report_in.report_date,
        received_date=report_in.received_date,
        remarks=report_in.remarks,
        submitted_by_user_id=current_user.id if current_user else None,
        evaluation_done=False,
        created_at=datetime.datetime.utcnow(),
    )
    db.add(report)
    db.flush()

    # Create result entries
    for entry_data in report_in.result_entries:
        param = db.query(Parameter).filter(Parameter.id == entry_data.parameter_id).first()
        if not param:
            raise HTTPException(status_code=404, detail=f"Parameter id={entry_data.parameter_id} not found")

        std = db.query(WaterQualityStandard).filter(
            WaterQualityStandard.parameter_id == entry_data.parameter_id,
            WaterQualityStandard.is_active == True,
        ).first()

        entry = LabResultEntry(
            report_id=report.id,
            parameter_id=entry_data.parameter_id,
            observed_value=entry_data.observed_value,
            is_qualitative=entry_data.is_qualitative,
            standard_id=std.id if std else None,
        )
        db.add(entry)

    db.commit()
    db.refresh(report)

    # ── EVALUATE ──────────────────────────────────────────────────────────────
    result_entries = db.query(LabResultEntry).filter(LabResultEntry.report_id == report.id).all()
    eval_result = evaluate_report(db, result_entries)

    # Update report with evaluation
    report.overall_result = eval_result["overall_result"]
    report.evaluation_done = True
    report.evaluated_at = datetime.datetime.utcnow()

    # Update entry statuses
    for entry, param_result in zip(result_entries, eval_result["parameter_results"]):
        entry.parameter_status = param_result["status"]
        entry.acceptable_limit = str(param_result["acceptable_limit"] or "")
        entry.permissible_limit = str(param_result["permissible_limit"] or "")

    db.commit()
    db.refresh(report)

    _audit(db, current_user, "RESULT_CREATED", "LabReport", report.id,
           report.report_id, f"Report submitted for sample {sample.sample_id}")

    # ── TRIGGER ALERT ENGINE ──────────────────────────────────────────────────
    alert = trigger_alert_engine(db, report, eval_result, current_user)

    # Count officers notified
    officers_count = 0
    alert_id_str = None
    ca_id_str = None
    rs_id_str = None
    if alert:
        alert_id_str = alert.alert_id
        officers_count = len(alert.notifications)
        if alert.corrective_actions:
            ca_id_str = alert.corrective_actions[0].action_id
        if alert.repeat_samples:
            rs_id_str = alert.repeat_samples[0].repeat_sample_id

    return EvaluationResponse(
        report_id=report.report_id,
        overall_result=eval_result["overall_result"],
        evaluation_summary=eval_result["evaluation_summary"],
        parameter_results=eval_result["parameter_results"],
        failed_parameters=eval_result["failed_parameters"],
        alert_created=alert is not None,
        alert_id=alert_id_str,
        corrective_action_id=ca_id_str,
        repeat_sample_id=rs_id_str,
        officers_notified=officers_count,
    )
