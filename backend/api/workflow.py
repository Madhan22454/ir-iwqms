"""Corrective Actions, Repeat Samples, Verifications, Escalation Rules, Audit, Notifications APIs."""
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from api.deps import get_db, CurrentUser
from models.workflow import CorrectiveAction, RepeatSample, Verification, EscalationRule
from models.alert import Alert
from models.audit import AuditLog
from models.alert import AlertNotification
from schemas.workflow import (
    CorrectiveActionOut, CorrectiveActionUpdate,
    RepeatSampleOut, RepeatSampleUpdate,
    VerificationCreate, VerificationOut,
    EscalationRuleCreate, EscalationRuleOut,
)
from schemas.audit import AuditLogOut

router = APIRouter()

def _audit(db, user, action, entity_type, entity_id, ref, details):
    log = AuditLog(
        user_id=user.id if user else None,
        user_name=user.name if user else "SYSTEM",
        user_role=user.role if user else "SYSTEM",
        action=action, entity_type=entity_type,
        entity_id=entity_id, entity_ref=ref, details=details,
    )
    db.add(log)
    db.commit()

# ── Corrective Actions ────────────────────────────────────────────────────────

@router.get("/corrective-actions/", response_model=List[CorrectiveActionOut])
def list_corrective_actions(
    alert_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(CorrectiveAction)
    if alert_id:
        q = q.filter(CorrectiveAction.alert_id == alert_id)
    if status:
        q = q.filter(CorrectiveAction.status == status)
    return q.order_by(CorrectiveAction.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/corrective-actions/{ca_id}", response_model=CorrectiveActionOut)
def get_corrective_action(ca_id: int, db: Session = Depends(get_db)):
    ca = db.query(CorrectiveAction).filter(CorrectiveAction.id == ca_id).first()
    if not ca:
        raise HTTPException(status_code=404, detail="Corrective Action not found")
    return ca

@router.patch("/corrective-actions/{ca_id}", response_model=CorrectiveActionOut)
def update_corrective_action(
    ca_id: int,
    update: CorrectiveActionUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None,
):
    ca = db.query(CorrectiveAction).filter(CorrectiveAction.id == ca_id).first()
    if not ca:
        raise HTTPException(status_code=404, detail="Corrective Action not found")

    for field, value in update.model_dump(exclude_none=True).items():
        setattr(ca, field, value)

    if update.status == "COMPLETED" and not ca.completed_date:
        ca.completed_date = datetime.datetime.utcnow()

    db.commit()
    db.refresh(ca)
    _audit(db, current_user, "CORRECTIVE_ACTION_UPDATED",
           "CorrectiveAction", ca.id, ca.action_id,
           f"Status updated to {ca.status}")
    return ca

# ── Repeat Samples ────────────────────────────────────────────────────────────

@router.get("/repeat-samples/", response_model=List[RepeatSampleOut])
def list_repeat_samples(
    alert_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(RepeatSample)
    if alert_id:
        q = q.filter(RepeatSample.alert_id == alert_id)
    if status:
        q = q.filter(RepeatSample.status == status)
    return q.order_by(RepeatSample.created_at.desc()).offset(skip).limit(limit).all()

@router.patch("/repeat-samples/{rs_id}", response_model=RepeatSampleOut)
def update_repeat_sample(
    rs_id: int,
    update: RepeatSampleUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None,
):
    rs = db.query(RepeatSample).filter(RepeatSample.id == rs_id).first()
    if not rs:
        raise HTTPException(status_code=404, detail="Repeat Sample not found")

    for field, value in update.model_dump(exclude_none=True).items():
        setattr(rs, field, value)

    db.commit()
    db.refresh(rs)
    _audit(db, current_user, "REPEAT_SAMPLE_UPDATED",
           "RepeatSample", rs.id, rs.repeat_sample_id,
           f"Status updated to {rs.status}")
    return rs

# ── Verifications ─────────────────────────────────────────────────────────────

@router.get("/verifications/", response_model=List[VerificationOut])
def list_verifications(
    alert_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Verification)
    if alert_id:
        q = q.filter(Verification.alert_id == alert_id)
    return q.all()

@router.post("/verifications/", response_model=VerificationOut)
def create_verification(
    ver: VerificationCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None,
):
    alert = db.query(Alert).filter(Alert.id == ver.alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.status == "CLOSED":
        raise HTTPException(status_code=400, detail="Alert already closed")

    db_ver = Verification(
        alert_id=ver.alert_id,
        verified_by_user_id=current_user.id if current_user else None,
        repeat_result=ver.repeat_result,
        remarks=ver.remarks,
        supporting_document_description=ver.supporting_document_description,
        decision=ver.decision,
        verification_date=datetime.datetime.utcnow(),
    )
    db.add(db_ver)

    # Apply decision
    if ver.decision == "CLOSE":
        alert.status = "CLOSED"
        alert.closed_at = datetime.datetime.utcnow()
    elif ver.decision == "ESCALATE":
        alert.is_escalated = True
        alert.escalation_level = (alert.escalation_level or 0) + 1
        alert.escalated_at = datetime.datetime.utcnow()
        alert.status = "ESCALATED"

    db.commit()
    db.refresh(db_ver)
    _audit(db, current_user, "VERIFICATION_COMPLETED",
           "Verification", db_ver.id, alert.alert_id,
           f"Decision: {ver.decision}. Result: {ver.repeat_result}")
    return db_ver

# ── Escalation Rules ──────────────────────────────────────────────────────────

@router.get("/escalation-rules/", response_model=List[EscalationRuleOut])
def list_escalation_rules(db: Session = Depends(get_db)):
    return db.query(EscalationRule).all()

@router.post("/escalation-rules/", response_model=EscalationRuleOut)
def create_escalation_rule(
    rule: EscalationRuleCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None,
):
    db_rule = EscalationRule(**rule.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

# ── Audit Log ─────────────────────────────────────────────────────────────────

@router.get("/audit/", response_model=List[AuditLogOut])
def get_audit_log(
    entity_type: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    skip: int = 0, limit: int = 200,
    db: Session = Depends(get_db),
):
    q = db.query(AuditLog)
    if entity_type:
        q = q.filter(AuditLog.entity_type == entity_type)
    if action:
        q = q.filter(AuditLog.action == action)
    return q.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

# ── Notifications ─────────────────────────────────────────────────────────────

@router.get("/notifications/")
def list_notifications(
    alert_id: Optional[int] = Query(None),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(AlertNotification)
    if alert_id:
        q = q.filter(AlertNotification.alert_id == alert_id)
    return q.order_by(AlertNotification.created_at.desc()).offset(skip).limit(limit).all()

# ── Reports data ──────────────────────────────────────────────────────────────

@router.get("/reports-data/")
def get_reports_data(
    report_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Returns aggregated data for the reports module."""
    from models.lab import LabReport
    from models.hierarchy import WaterSource, Station, Division, Zone
    from sqlalchemy import func

    results = db.query(LabReport).filter(LabReport.evaluation_done == True).all()
    data = []
    for r in results:
        sample = r.sample
        if not sample:
            continue
        source = db.query(WaterSource).filter(WaterSource.id == sample.water_source_id).first()
        station = db.query(Station).filter(Station.id == source.station_id).first() if source else None
        division = db.query(Division).filter(Division.id == station.division_id).first() if station else None
        zone = db.query(Zone).filter(Zone.id == division.zone_id).first() if division else None

        data.append({
            "report_id": r.report_id,
            "lab_report_number": r.lab_report_number,
            "overall_result": r.overall_result,
            "report_date": r.report_date,
            "sample_type": sample.sample_type,
            "source_id_code": source.source_id_code if source else None,
            "station_name": station.name if station else None,
            "division_name": division.name if division else None,
            "zone_name": zone.name if zone else None,
        })

    if report_type:
        data = [d for d in data if d.get("overall_result") == report_type]

    return data
