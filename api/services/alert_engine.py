"""
Automatic Alert Engine

When a lab report is evaluated as UNFIT or UNSATISFACTORY:
1. Update water source status
2. Create a Critical Alert record
3. Find all concerned officers (via OfficerResponsibility + hierarchy)
4. Create notification records (simulated email)
5. Create a CorrectiveAction record automatically
6. Create a RepeatSample record
7. Log to AuditLog
"""
import datetime
import json
from typing import Optional
from sqlalchemy.orm import Session

from models.hierarchy import WaterSource, Station, Division, Zone
from models.lab import LabReport
from models.alert import Alert, AlertNotification, OfficerResponsibility
from models.workflow import CorrectiveAction, RepeatSample
from models.audit import AuditLog
from models.user import User


def _generate_alert_id(db: Session) -> str:
    count = db.query(Alert).count() + 1
    year = datetime.datetime.utcnow().year
    return f"ALT-{year}-{count:04d}"


def _generate_ca_id(db: Session) -> str:
    count = db.query(CorrectiveAction).count() + 1
    year = datetime.datetime.utcnow().year
    return f"CA-{year}-{count:04d}"


def _generate_rs_id(db: Session) -> str:
    count = db.query(RepeatSample).count() + 1
    year = datetime.datetime.utcnow().year
    return f"RS-{year}-{count:04d}"


def get_concerned_officers(db: Session, water_source_id: int):
    """Find all responsible officers for a water source via OfficerResponsibility and hierarchy."""
    officers = []

    # 1. Explicitly mapped officers for this source
    responsibilities = db.query(OfficerResponsibility).filter(
        OfficerResponsibility.water_source_id == water_source_id,
        OfficerResponsibility.is_active == True,
    ).all()

    for resp in responsibilities:
        user = db.query(User).filter(User.id == resp.user_id, User.is_active == True).first()
        if user:
            officers.append(user)

    # 2. Fall back to hierarchy-based officers if no explicit mapping
    if not officers:
        source = db.query(WaterSource).filter(WaterSource.id == water_source_id).first()
        if source:
            station = db.query(Station).filter(Station.id == source.station_id).first()
            if station:
                division = db.query(Division).filter(Division.id == station.division_id).first()
                if division:
                    zone = db.query(Zone).filter(Zone.id == division.zone_id).first()

                    # Users at station level
                    officers += db.query(User).filter(
                        User.station_id == station.id, User.is_active == True
                    ).all()
                    # Users at division level
                    officers += db.query(User).filter(
                        User.division_id == division.id, User.station_id == None,
                        User.is_active == True
                    ).all()
                    # Zonal admins
                    if zone:
                        officers += db.query(User).filter(
                            User.zone_id == zone.id, User.division_id == None,
                            User.is_active == True
                        ).all()

    # 3. Always include Central Admin
    admins = db.query(User).filter(
        User.role == "CENTRAL_ADMIN", User.is_active == True
    ).all()
    officers += admins

    # Deduplicate by user id
    seen = set()
    unique = []
    for u in officers:
        if u.id not in seen:
            seen.add(u.id)
            unique.append(u)
    return unique


def trigger_alert_engine(
    db: Session,
    lab_report: LabReport,
    evaluation_result: dict,
    submitted_by_user: Optional[User] = None,
) -> Optional[Alert]:
    """
    Called after report evaluation. If UNFIT or UNSATISFACTORY:
    - Creates Alert
    - Notifies concerned officers
    - Creates CorrectiveAction
    - Creates RepeatSample
    - Logs audit
    Returns the created Alert or None if FIT.
    """
    overall = evaluation_result["overall_result"]
    if overall == "FIT":
        # Just update water source status and log
        _update_source_status(db, lab_report, "COMPLIANT", evaluation_result)
        _log(db, submitted_by_user, "RESULT_EVALUATED",
             "LabReport", lab_report.id, lab_report.report_id,
             f"Result: FIT — source marked COMPLIANT")
        return None

    # --- UNFIT or UNSATISFACTORY ---
    severity = "CRITICAL"
    new_status = overall  # "UNFIT" or "UNSATISFACTORY"

    # Update source status + failure count
    source = _update_source_status(db, lab_report, new_status, evaluation_result)
    if not source:
        return None

    # Fetch hierarchy for denormalization
    station = db.query(Station).filter(Station.id == source.station_id).first()
    division = db.query(Division).filter(Division.id == station.division_id).first() if station else None
    zone = db.query(Zone).filter(Zone.id == division.zone_id).first() if division else None
    lab = lab_report.laboratory

    # Build failed parameters JSON
    failed_params = evaluation_result.get("failed_parameters", [])
    failed_json = [
        {
            "name": fp["parameter_name"],
            "observed": fp["observed"],
            "limit": fp["acceptable_limit"],
            "status": fp["status"],
        }
        for fp in failed_params
    ]

    # Get sample
    sample = lab_report.sample

    # Create Alert
    alert = Alert(
        alert_id=_generate_alert_id(db),
        alert_type="WATER_QUALITY",
        severity=severity,
        lab_report_id=lab_report.id,
        water_source_id=source.id,
        source_id_code=source.source_id_code,
        zone_name=zone.name if zone else "",
        division_name=division.name if division else "",
        station_name=station.name if station else "",
        source_type=source.source_type or "",
        sample_result=overall,
        sample_date=sample.collection_date if sample else datetime.datetime.utcnow(),
        report_date=lab_report.report_date,
        lab_name=lab.name if lab else "",
        failed_parameters=failed_json,
        remarks=evaluation_result.get("evaluation_summary", ""),
        status="OPEN",
        due_date=datetime.datetime.utcnow() + datetime.timedelta(hours=48),
        created_at=datetime.datetime.utcnow(),
    )
    db.add(alert)
    db.flush()  # get alert.id

    # Find and notify concerned officers
    officers = get_concerned_officers(db, source.id)
    for officer in officers:
        notif = AlertNotification(
            alert_id=alert.id,
            user_id=officer.id,
            recipient_name=officer.name,
            recipient_role=officer.role,
            recipient_email=officer.email,
            notification_type="EMAIL",
            status="SIMULATED",  # In prod: send actual email and mark SENT/FAILED
            sent_at=datetime.datetime.utcnow(),
        )
        db.add(notif)

    # Auto-create Corrective Action
    failed_param_names = ", ".join(fp["parameter_name"] for fp in failed_params)
    ca = CorrectiveAction(
        action_id=_generate_ca_id(db),
        alert_id=alert.id,
        water_source_id=source.id,
        problem_description=f"Water source {source.source_id_code} returned {overall} result. "
                            f"Failed parameters: {failed_param_names}",
        failed_parameters=failed_param_names,
        corrective_action_description=(
            "1. Immediately investigate the water source.\n"
            "2. Isolate source if bacteriological contamination confirmed.\n"
            "3. Conduct thorough disinfection of the system.\n"
            "4. Check and repair any infrastructure defects.\n"
            "5. Arrange repeat sample after corrective action."
        ),
        status="OPEN",
        target_date=datetime.datetime.utcnow() + datetime.timedelta(days=7),
        created_at=datetime.datetime.utcnow(),
    )
    db.add(ca)

    # Auto-create Repeat Sample request
    rs = RepeatSample(
        repeat_sample_id=_generate_rs_id(db),
        alert_id=alert.id,
        original_sample_id=lab_report.sample_id,
        water_source_id=source.id,
        scheduled_date=datetime.datetime.utcnow() + datetime.timedelta(days=7),
        status="DUE",
        remarks=f"Repeat sample required after corrective action for Alert {alert.alert_id}",
        created_at=datetime.datetime.utcnow(),
    )
    db.add(rs)

    db.commit()
    db.refresh(alert)

    # Log audit
    _log(db, submitted_by_user, "ALERT_CREATED",
         "Alert", alert.id, alert.alert_id,
         f"Auto-created {severity} alert for {overall} result on source {source.source_id_code}. "
         f"Failed: {failed_param_names}. Notified {len(officers)} officer(s).")
    _log(db, submitted_by_user, "CORRECTIVE_ACTION_CREATED",
         "CorrectiveAction", ca.id, ca.action_id,
         f"Auto-created corrective action for alert {alert.alert_id}")
    _log(db, submitted_by_user, "REPEAT_SAMPLE_CREATED",
         "RepeatSample", rs.id, rs.repeat_sample_id,
         f"Auto-created repeat sample for alert {alert.alert_id}")
    if officers:
        _log(db, submitted_by_user, "NOTIFICATION_CREATED",
             "Alert", alert.id, alert.alert_id,
             f"Simulated notifications sent to: {', '.join(o.name for o in officers)}")

    return alert


def _update_source_status(db: Session, lab_report: LabReport, new_status: str, evaluation_result: dict):
    sample = lab_report.sample
    if not sample:
        return None
    source = db.query(WaterSource).filter(WaterSource.id == sample.water_source_id).first()
    if not source:
        return None

    source.current_status = new_status
    if new_status in ("UNFIT", "UNSATISFACTORY"):
        source.consecutive_failures = (source.consecutive_failures or 0) + 1
        source.total_failures = (source.total_failures or 0) + 1
        # Persistent failure threshold: 3 consecutive failures
        if source.consecutive_failures >= 3:
            source.current_status = "PERSISTENT_FAILURE"
    else:
        source.consecutive_failures = 0

    # Update last sample date
    if sample.sample_type and "BACTER" in sample.sample_type.upper():
        source.last_bacteriological_sample_date = sample.collection_date
        source.next_bacteriological_sample_due = sample.collection_date + datetime.timedelta(days=30)
    else:
        source.last_chemical_sample_date = sample.collection_date
        source.next_chemical_sample_due = sample.collection_date + datetime.timedelta(days=90)

    db.add(source)
    db.flush()
    return source


def _log(db: Session, user: Optional[User], action: str,
         entity_type: str, entity_id: int, entity_ref: str, details: str):
    log = AuditLog(
        user_id=user.id if user else None,
        user_name=user.name if user else "SYSTEM",
        user_role=user.role if user else "SYSTEM",
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_ref=entity_ref,
        details=details,
        created_at=datetime.datetime.utcnow(),
    )
    db.add(log)
    db.commit()
