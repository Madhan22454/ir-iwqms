"""Alerts API — list, filter, detail, acknowledge, notice generation."""
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from api.deps import get_db, CurrentUser
from models.alert import Alert, AlertNotification, OfficerResponsibility
from models.audit import AuditLog
from schemas.alert import (
    AlertListItem, AlertDetail, AcknowledgeRequest,
    OfficerResponsibilityCreate, OfficerResponsibilityOut,
)

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


# ── Alert List ────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[AlertListItem])
def list_alerts(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    result: Optional[str] = Query(None),
    zone: Optional[str] = Query(None),
    skip: int = 0, limit: int = 200,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None,
):
    q = db.query(Alert)
    
    if current_user:
        if current_user.role == "ZONAL_ADMIN" and current_user.zone:
            q = q.filter(Alert.zone_name == current_user.zone.name)
        elif current_user.role == "DIVISIONAL_OFFICER" and current_user.division:
            q = q.filter(Alert.division_name == current_user.division.name)
        elif current_user.role == "STATION_INCHARGE" and current_user.station:
            q = q.filter(Alert.station_name == current_user.station.name)
    if status:
        statuses = [s.strip() for s in status.split(",")]
        q = q.filter(Alert.status.in_(statuses))
    if severity:
        q = q.filter(Alert.severity == severity)
    if result:
        results = [r.strip() for r in result.split(",")]
        q = q.filter(Alert.sample_result.in_(results))
    if zone:
        q = q.filter(Alert.zone_name.ilike(f"%{zone}%"))
    return q.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/summary")
def alert_summary(db: Session = Depends(get_db), current_user: CurrentUser = None):
    """Dashboard counts for the Alert Centre widget."""
    q = db.query(Alert)
    
    if current_user:
        if current_user.role == "ZONAL_ADMIN" and current_user.zone:
            q = q.filter(Alert.zone_name == current_user.zone.name)
        elif current_user.role == "DIVISIONAL_OFFICER" and current_user.division:
            q = q.filter(Alert.division_name == current_user.division.name)
        elif current_user.role == "STATION_INCHARGE" and current_user.station:
            q = q.filter(Alert.station_name == current_user.station.name)

    total = q.count()
    critical = q.filter(Alert.severity == "CRITICAL").count()
    open_count = q.filter(Alert.status == "OPEN").count()
    unfit = q.filter(Alert.sample_result == "UNFIT").count()
    unsatisfactory = q.filter(Alert.sample_result == "UNSATISFACTORY").count()
    escalated = q.filter(Alert.is_escalated == True).count()
    closed = q.filter(Alert.status == "CLOSED").count()
    return {
        "total": total, "critical": critical, "open": open_count,
        "unfit": unfit, "unsatisfactory": unsatisfactory,
        "escalated": escalated, "closed": closed,
    }


@router.get("/{alert_id}", response_model=AlertDetail)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


# ── Acknowledge ───────────────────────────────────────────────────────────────

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    req: AcknowledgeRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None,
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.status == "CLOSED":
        raise HTTPException(status_code=400, detail="Alert is already closed")

    if alert.status == "OPEN":
        alert.status = "ACKNOWLEDGED"
        alert.acknowledged_at = datetime.datetime.utcnow()
        alert.acknowledged_by_user_id = current_user.id if current_user else None
        alert.acknowledgement_remarks = req.remarks
        db.commit()
        _audit(db, current_user, "ALERT_ACKNOWLEDGED", "Alert", alert.id, alert.alert_id,
               f"Alert acknowledged. Remarks: {req.remarks}")
    return {"message": "Alert acknowledged", "status": alert.status}


# ── Escalate ──────────────────────────────────────────────────────────────────

@router.post("/{alert_id}/escalate")
def escalate_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None,
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.status == "CLOSED":
        raise HTTPException(status_code=400, detail="Cannot escalate a closed alert")

    alert.is_escalated = True
    alert.escalation_level = (alert.escalation_level or 0) + 1
    alert.escalated_at = datetime.datetime.utcnow()
    alert.status = "ESCALATED"
    db.commit()
    _audit(db, current_user, "ALERT_ESCALATED", "Alert", alert.id, alert.alert_id,
           f"Alert escalated to level {alert.escalation_level}")
    return {"message": "Alert escalated", "escalation_level": alert.escalation_level}


# ── Close ─────────────────────────────────────────────────────────────────────

@router.post("/{alert_id}/close")
def close_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None,
):
    """Close alert — requires a verification to have been completed first."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.status == "CLOSED":
        return {"message": "Alert already closed"}

    # Must have at least one verification
    if not alert.verifications:
        raise HTTPException(
            status_code=400,
            detail="Verification must be completed before closing an alert."
        )

    alert.status = "CLOSED"
    alert.closed_at = datetime.datetime.utcnow()
    db.commit()
    _audit(db, current_user, "ALERT_CLOSED", "Alert", alert.id, alert.alert_id,
           "Alert closed after successful verification.")
    return {"message": "Alert closed successfully"}


# ── Notice data (for print view) ──────────────────────────────────────────────

@router.get("/{alert_id}/notice")
def get_alert_notice(alert_id: int, db: Session = Depends(get_db)):
    """Returns structured data for the printable Alert Notice."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    notifications = db.query(AlertNotification).filter(
        AlertNotification.alert_id == alert.id
    ).all()

    from models.workflow import CorrectiveAction, RepeatSample
    ca = db.query(CorrectiveAction).filter(CorrectiveAction.alert_id == alert.id).first()
    rs = db.query(RepeatSample).filter(RepeatSample.alert_id == alert.id).first()

    return {
        "alert": {
            "alert_id": alert.alert_id,
            "severity": alert.severity,
            "created_at": alert.created_at,
            "due_date": alert.due_date,
            "status": alert.status,
            "sample_result": alert.sample_result,
            "source_id_code": alert.source_id_code,
            "zone_name": alert.zone_name,
            "division_name": alert.division_name,
            "station_name": alert.station_name,
            "source_type": alert.source_type,
            "sample_date": alert.sample_date,
            "report_date": alert.report_date,
            "lab_name": alert.lab_name,
            "failed_parameters": alert.failed_parameters or [],
            "remarks": alert.remarks,
        },
        "notifications": [
            {"name": n.recipient_name, "role": n.recipient_role, "email": n.recipient_email}
            for n in notifications
        ],
        "corrective_action": {
            "action_id": ca.action_id,
            "description": ca.corrective_action_description,
            "target_date": ca.target_date,
            "status": ca.status,
        } if ca else None,
        "repeat_sample": {
            "repeat_sample_id": rs.repeat_sample_id,
            "scheduled_date": rs.scheduled_date,
            "status": rs.status,
        } if rs else None,
    }


# ── Officer Responsibility ────────────────────────────────────────────────────

@router.get("/officers/responsibilities", response_model=List[OfficerResponsibilityOut])
def list_responsibilities(
    water_source_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(OfficerResponsibility)
    if water_source_id:
        q = q.filter(OfficerResponsibility.water_source_id == water_source_id)
    return q.all()

@router.post("/officers/responsibilities", response_model=OfficerResponsibilityOut)
def create_responsibility(
    resp: OfficerResponsibilityCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None,
):
    db_resp = OfficerResponsibility(**resp.model_dump())
    db.add(db_resp)
    db.commit()
    db.refresh(db_resp)
    return db_resp
