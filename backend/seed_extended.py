"""
Extended Seed Script — IR-IWQMS Comprehensive Demo Data
Southern Railway (SR) with complete workflow demonstrations.

Run: python seed_extended.py
"""
import sys, os, datetime, json
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault("PYTHONIOENCODING", "utf-8")

from database import SessionLocal, engine, Base
from models import user, hierarchy, master, lab, alert, workflow, audit  # noqa

Base.metadata.create_all(bind=engine)
db = SessionLocal()

now = datetime.datetime.utcnow()


def seed_all():
    print("[SEED] Starting IR-IWQMS extended seed (Southern Railway demo)...")

    # ─────────────────────────────────────────────────────────────────────────
    # USERS
    # ─────────────────────────────────────────────────────────────────────────
    from models.user import User, UserRole
    from core.security import get_password_hash

    users_data = [
        dict(employee_id="central.admin", name="Central Admin", email="central.admin@sr.ir.in",
             role="CENTRAL_ADMIN", password="admin123"),
        dict(employee_id="zonal.admin", name="Zonal Admin SR", email="zonal.admin@sr.ir.in",
             role="ZONAL_ADMIN", password="admin123"),
        dict(employee_id="division.officer", name="Div Officer Chennai", email="division.officer@sr.ir.in",
             role="DIVISIONAL_OFFICER", password="admin123"),
        dict(employee_id="hmi.user", name="H&MI Chennai", email="hmi.user@sr.ir.in",
             role="HMI", password="admin123"),
        dict(employee_id="lab.user", name="Lab Technician SR", email="lab.user@sr.ir.in",
             role="LABORATORY", password="admin123"),
        dict(employee_id="engineering.user", name="Sec Engineer MAS", email="engineering.user@sr.ir.in",
             role="ENGINEERING", password="admin123"),
        dict(employee_id="station.user", name="Station Incharge MAS", email="station.user@sr.ir.in",
             role="STATION_INCHARGE", password="admin123"),
        dict(employee_id="management.user", name="Senior Mgmt SR", email="management.user@sr.ir.in",
             role="SENIOR_MANAGEMENT", password="admin123"),
        dict(employee_id="DO-TPJ-001", name="Div Officer Trichy", email="do.tpj2@ir.in",
             role="DIVISIONAL_OFFICER", password="admin123"),
        dict(employee_id="HMI-TBM-001", name="H&MI Tambaram", email="hmi.tbm2@ir.in",
             role="HMI", password="admin123"),
    ]

    user_map = {}
    for u in users_data:
        existing = db.query(User).filter(User.employee_id == u["employee_id"]).first()
        if not existing:
            new_user = User(
                employee_id=u["employee_id"], name=u["name"], email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                role=u["role"], is_active=True,
            )
            db.add(new_user)
            db.flush()
            user_map[u["employee_id"]] = new_user
            print(f"  [USER] {u['employee_id']} ({u['role']})")
        else:
            user_map[u["employee_id"]] = existing
    db.commit()

    # ─────────────────────────────────────────────────────────────────────────
    # ZONES
    # ─────────────────────────────────────────────────────────────────────────
    from models.hierarchy import Zone, Division, Station, WaterSource

    zones_data = [
        dict(name="Southern Railway", code="SR"),
        dict(name="Western Railway", code="WR"),
        dict(name="Northern Railway", code="NR"),
    ]
    zone_map = {}
    for z in zones_data:
        existing = db.query(Zone).filter(Zone.code == z["code"]).first()
        if not existing:
            obj = Zone(**z); db.add(obj); db.flush()
            zone_map[z["code"]] = obj
            print(f"  [ZONE] {z['name']}")
        else:
            zone_map[z["code"]] = existing
    db.commit()

    # Update zone users
    if "zonal.admin" in user_map:
        user_map["zonal.admin"].zone_id = zone_map["SR"].id
    db.commit()

    # ─────────────────────────────────────────────────────────────────────────
    # DIVISIONS (SR focus)
    # ─────────────────────────────────────────────────────────────────────────
    divs_data = [
        dict(name="Chennai Division", code="MAS", zone_code="SR"),
        dict(name="Salem Division", code="SA", zone_code="SR"),
        dict(name="Coimbatore Division", code="CBE", zone_code="SR"),
        dict(name="Palakkad Division", code="PGT", zone_code="SR"),
        dict(name="Trivandrum Division", code="TVC", zone_code="SR"),
        dict(name="Mumbai Division", code="BCT", zone_code="WR"),
    ]
    div_map = {}
    for d in divs_data:
        existing = db.query(Division).filter(Division.code == d["code"]).first()
        if not existing:
            obj = Division(name=d["name"], code=d["code"], zone_id=zone_map[d["zone_code"]].id)
            db.add(obj); db.flush()
            div_map[d["code"]] = obj
            print(f"  [DIV] {d['name']}")
        else:
            div_map[d["code"]] = existing
    db.commit()

    if "division.officer" in user_map:
        user_map["division.officer"].division_id = div_map["MAS"].id
    db.commit()

    # ─────────────────────────────────────────────────────────────────────────
    # STATIONS
    # ─────────────────────────────────────────────────────────────────────────
    stations_data = [
        dict(name="Chennai Central", code="MAS", cat="A1", div="MAS", lat=13.0827, lng=80.2707),
        dict(name="Chennai Egmore", code="MS", cat="A", div="MAS", lat=13.0782, lng=80.2672),
        dict(name="Tambaram", code="TBM", cat="B", div="MAS", lat=12.9249, lng=80.1000),
        dict(name="Arakkonam", code="AJJ", cat="B", div="MAS", lat=13.0836, lng=79.6702),
        dict(name="Villupuram", code="VM", cat="B", div="MAS", lat=11.9396, lng=79.4924),
        dict(name="Salem Junction", code="SA", cat="A", div="SA", lat=11.6644, lng=78.1460),
        dict(name="Coimbatore Junction", code="CBE", cat="A1", div="CBE", lat=11.0042, lng=76.9754),
        dict(name="Palakkad Junction", code="PGT", cat="A", div="PGT", lat=10.7867, lng=76.6548),
        dict(name="Shoranur Junction", code="SRR", cat="B", div="PGT", lat=10.7654, lng=76.2785),
        dict(name="Trivandrum Central", code="TVC", cat="A1", div="TVC", lat=8.4875, lng=76.9525),
        dict(name="Mumbai Central", code="BCT", cat="A1", div="BCT", lat=18.9697, lng=72.8194),
    ]
    station_map = {}
    for s in stations_data:
        existing = db.query(Station).filter(Station.code == s["code"]).first()
        if not existing:
            obj = Station(
                name=s["name"], code=s["code"], category=s["cat"],
                division_id=div_map[s["div"]].id,
                gps_lat=s["lat"], gps_long=s["lng"],
            )
            db.add(obj); db.flush()
            station_map[s["code"]] = obj
            print(f"  [STN] {s['name']}")
        else:
            station_map[s["code"]] = existing
    db.commit()

    if "station.user" in user_map:
        user_map["station.user"].station_id = station_map["MAS"].id
    db.commit()

    # ─────────────────────────────────────────────────────────────────────────
    # WATER SOURCES (varied statuses for demo)
    # ─────────────────────────────────────────────────────────────────────────
    sources_data = [
        # Chennai Central — COMPLIANT
        dict(code="MAS-BW-01", stn="MAS", type="Borewell", cap="50,000 L/day",
             areas="Platform 1-5, Waiting Hall", pop=5000, tank="2x25kL",
             treat="Chlorination", dis_m="Chlorination", dis_freq=30,
             status="COMPLIANT", cons_fail=0, lat=13.0827, lng=80.2705,
             last_bact=now-datetime.timedelta(days=10),
             next_bact=now+datetime.timedelta(days=20),
             last_chem=now-datetime.timedelta(days=25),
             next_chem=now+datetime.timedelta(days=65),
             last_dis=now-datetime.timedelta(days=5),
             next_dis=now+datetime.timedelta(days=25),
             cl=0.3),
        # Chennai Central — UNFIT (for demo alert)
        dict(code="MAS-OW-01", stn="MAS", type="Open Well", cap="20,000 L/day",
             areas="Goods Shed, Workshop", pop=800, tank="1x20kL",
             treat="None", dis_m="Bleaching Powder", dis_freq=15,
             status="UNFIT", cons_fail=1, lat=13.0826, lng=80.2708,
             last_bact=now-datetime.timedelta(days=3),
             next_bact=now+datetime.timedelta(days=27),
             last_chem=now-datetime.timedelta(days=15),
             next_chem=now+datetime.timedelta(days=75),
             last_dis=now-datetime.timedelta(days=3),
             next_dis=now+datetime.timedelta(days=12),
             cl=0.0),
        # Tambaram — COMPLIANT
        dict(code="TBM-PL-01", stn="TBM", type="Pipeline (CMWSSB)", cap="30,000 L/day",
             areas="Platform 1-3, Staff Quarters", pop=2000, tank="1x30kL",
             treat="None", dis_m="Chlorination", dis_freq=30,
             status="COMPLIANT", cons_fail=0, lat=12.9249, lng=80.1001,
             last_bact=now-datetime.timedelta(days=5),
             next_bact=now+datetime.timedelta(days=25),
             last_chem=now-datetime.timedelta(days=20),
             next_chem=now+datetime.timedelta(days=70),
             last_dis=now-datetime.timedelta(days=3),
             next_dis=now+datetime.timedelta(days=27),
             cl=0.4),
        # Arakkonam — OVERDUE
        dict(code="AJJ-BW-01", stn="AJJ", type="Borewell", cap="15,000 L/day",
             areas="All Platforms", pop=600, tank="1x15kL",
             treat="UV", dis_m="Chlorination", dis_freq=30,
             status="OVERDUE", cons_fail=0, lat=13.0836, lng=79.6702,
             last_bact=now-datetime.timedelta(days=65),
             next_bact=now-datetime.timedelta(days=35),
             last_chem=now-datetime.timedelta(days=130),
             next_chem=now-datetime.timedelta(days=40),
             last_dis=now-datetime.timedelta(days=45),
             next_dis=now-datetime.timedelta(days=15),
             cl=None),
        # Salem — UNSATISFACTORY
        dict(code="SA-BW-01", stn="SA", type="Borewell", cap="35,000 L/day",
             areas="Platform 1-4, Catering", pop=1500, tank="2x17.5kL",
             treat="Filtration", dis_m="Chlorination+UV", dis_freq=30,
             status="UNSATISFACTORY", cons_fail=1, lat=11.6644, lng=78.1460,
             last_bact=now-datetime.timedelta(days=8),
             next_bact=now+datetime.timedelta(days=22),
             last_chem=now-datetime.timedelta(days=20),
             next_chem=now+datetime.timedelta(days=70),
             last_dis=now-datetime.timedelta(days=8),
             next_dis=now+datetime.timedelta(days=22),
             cl=0.1),
        # Coimbatore — COMPLIANT
        dict(code="CBE-PL-01", stn="CBE", type="Pipeline (TWAD)", cap="80,000 L/day",
             areas="All Platforms, Offices", pop=8000, tank="4x20kL",
             treat="RO Plant", dis_m="Chlorination+RO", dis_freq=30,
             status="COMPLIANT", cons_fail=0, lat=11.0042, lng=76.9754,
             last_bact=now-datetime.timedelta(days=2),
             next_bact=now+datetime.timedelta(days=28),
             last_chem=now-datetime.timedelta(days=8),
             next_chem=now+datetime.timedelta(days=82),
             last_dis=now-datetime.timedelta(days=1),
             next_dis=now+datetime.timedelta(days=29),
             cl=0.5),
        # Palakkad — PERSISTENT FAILURE
        dict(code="PGT-BW-01", stn="PGT", type="Borewell", cap="25,000 L/day",
             areas="Platform 1-3", pop=1000, tank="1x25kL",
             treat="Chlorination", dis_m="Chlorination", dis_freq=30,
             status="PERSISTENT_FAILURE", cons_fail=3, lat=10.7867, lng=76.6548,
             last_bact=now-datetime.timedelta(days=5),
             next_bact=now+datetime.timedelta(days=25),
             last_chem=now-datetime.timedelta(days=18),
             next_chem=now+datetime.timedelta(days=72),
             last_dis=now-datetime.timedelta(days=5),
             next_dis=now+datetime.timedelta(days=25),
             cl=0.0),
        # Trivandrum — COMPLIANT
        dict(code="TVC-PL-01", stn="TVC", type="Pipeline (KWA)", cap="100,000 L/day",
             areas="All Platforms, VIP Lounge, Catering", pop=12000, tank="4x25kL",
             treat="None", dis_m="Chlorination", dis_freq=30,
             status="COMPLIANT", cons_fail=0, lat=8.4875, lng=76.9525,
             last_bact=now-datetime.timedelta(days=1),
             next_bact=now+datetime.timedelta(days=29),
             last_chem=now-datetime.timedelta(days=5),
             next_chem=now+datetime.timedelta(days=85),
             last_dis=now-datetime.timedelta(days=2),
             next_dis=now+datetime.timedelta(days=28),
             cl=0.6),
        # Chennai Egmore — DUE
        dict(code="MS-BW-01", stn="MS", type="Borewell", cap="18,000 L/day",
             areas="Platform 1-6", pop=1200, tank="1x18kL",
             treat="Chlorination", dis_m="Chlorination", dis_freq=30,
             status="OVERDUE", cons_fail=0, lat=13.0782, lng=80.2673,
             last_bact=now-datetime.timedelta(days=35),
             next_bact=now-datetime.timedelta(days=5),
             last_chem=now-datetime.timedelta(days=95),
             next_chem=now-datetime.timedelta(days=5),
             last_dis=now-datetime.timedelta(days=35),
             next_dis=now-datetime.timedelta(days=5),
             cl=None),
    ]

    source_map = {}
    for s in sources_data:
        existing = db.query(WaterSource).filter(WaterSource.source_id_code == s["code"]).first()
        if not existing:
            obj = WaterSource(
                source_id_code=s["code"],
                station_id=station_map[s["stn"]].id,
                source_type=s["type"], capacity=s["cap"],
                areas_supplied=s["areas"], population_served=s["pop"],
                storage_tank=s["tank"], treatment_facility=s["treat"],
                disinfection_method=s["dis_m"],
                disinfection_frequency_days=s["dis_freq"],
                gps_lat=s["lat"], gps_long=s["lng"],
                current_status=s["status"],
                consecutive_failures=s["cons_fail"],
                total_failures=s["cons_fail"],
                last_bacteriological_sample_date=s["last_bact"],
                next_bacteriological_sample_due=s["next_bact"],
                last_chemical_sample_date=s["last_chem"],
                next_chemical_sample_due=s["next_chem"],
                last_disinfection_date=s["last_dis"],
                next_disinfection_due=s["next_dis"],
                residual_chlorine_last=s["cl"],
            )
            db.add(obj); db.flush()
            source_map[s["code"]] = obj
            print(f"  [WS] {s['code']} [{s['status']}]")
        else:
            source_map[s["code"]] = existing
    db.commit()

    # ─────────────────────────────────────────────────────────────────────────
    # LABORATORY
    # ─────────────────────────────────────────────────────────────────────────
    from models.lab import Laboratory, LabSample, LabReport, LabResultEntry

    labs_data = [
        dict(name="SR Central Water Testing Lab", code="SR-WTL",
             location="Chennai", accreditation_number="NABL-WQ-2024-001",
             contact_person="Dr. K. Rajan", contact_email="lab.central@sr.ir.in",
             contact_phone="9445000001", is_active=True),
        dict(name="Divisional Water Lab Chennai", code="MAS-WTL",
             location="Chennai", accreditation_number="NABL-WQ-2024-002",
             contact_person="Mr. S. Kumar", contact_email="lab.mas@sr.ir.in",
             contact_phone="9445000002", is_active=True),
    ]
    lab_map = {}
    for l in labs_data:
        existing = db.query(Laboratory).filter(Laboratory.code == l["code"]).first()
        if not existing:
            obj = Laboratory(**l); db.add(obj); db.flush()
            lab_map[l["code"]] = obj
            print(f"  [LAB] {l['name']}")
        else:
            lab_map[l["code"]] = existing
    db.commit()

    # ─────────────────────────────────────────────────────────────────────────
    # PARAMETERS
    # ─────────────────────────────────────────────────────────────────────────
    from models.master import Parameter, WaterQualityStandard

    params_data = [
        dict(name="pH", cat="Chemical", unit="pH units", qualitative=False, order=1),
        dict(name="Turbidity", cat="Physical", unit="NTU", qualitative=False, order=2),
        dict(name="Total Dissolved Solids", cat="Chemical", unit="mg/L", qualitative=False, order=3),
        dict(name="Total Hardness", cat="Chemical", unit="mg/L as CaCO3", qualitative=False, order=4),
        dict(name="Total Alkalinity", cat="Chemical", unit="mg/L as CaCO3", qualitative=False, order=5),
        dict(name="Fluoride", cat="Chemical", unit="mg/L", qualitative=False, order=6),
        dict(name="Chloride", cat="Chemical", unit="mg/L", qualitative=False, order=7),
        dict(name="Sulphate", cat="Chemical", unit="mg/L", qualitative=False, order=8),
        dict(name="Nitrate", cat="Chemical", unit="mg/L", qualitative=False, order=9),
        dict(name="Iron", cat="Chemical", unit="mg/L", qualitative=False, order=10),
        dict(name="Arsenic", cat="Chemical", unit="mg/L", qualitative=False, order=11),
        dict(name="Total Coliform", cat="Bacteriological", unit="MPN/100mL", qualitative=True, order=12),
        dict(name="E. coli", cat="Bacteriological", unit="MPN/100mL", qualitative=True, order=13),
        dict(name="Free Residual Chlorine", cat="Chemical", unit="mg/L", qualitative=False, order=14),
        dict(name="Colour", cat="Physical", unit="Hazen units", qualitative=False, order=15),
        dict(name="Ammonia", cat="Chemical", unit="mg/L", qualitative=False, order=16),
    ]
    param_map = {}
    for p in params_data:
        existing = db.query(Parameter).filter(Parameter.name == p["name"]).first()
        if not existing:
            obj = Parameter(
                name=p["name"], category=p["cat"], unit=p["unit"],
                is_qualitative=p["qualitative"], display_order=p["order"], is_active=True,
            )
            db.add(obj); db.flush()
            param_map[p["name"]] = obj
            print(f"  [PARAM] {p['name']}")
        else:
            param_map[p["name"]] = existing
    db.commit()

    # ─────────────────────────────────────────────────────────────────────────
    # STANDARDS (BIS IS 10500)
    # ─────────────────────────────────────────────────────────────────────────
    standards_data = [
        dict(param="pH", std="BIS IS 10500", mn=6.5, acc=8.5, perm=9.2, q_acc=None),
        dict(param="Turbidity", std="BIS IS 10500", mn=None, acc=1.0, perm=5.0, q_acc=None),
        dict(param="Total Dissolved Solids", std="BIS IS 10500", mn=None, acc=500.0, perm=2000.0, q_acc=None),
        dict(param="Total Hardness", std="BIS IS 10500", mn=None, acc=200.0, perm=600.0, q_acc=None),
        dict(param="Total Alkalinity", std="BIS IS 10500", mn=None, acc=200.0, perm=600.0, q_acc=None),
        dict(param="Fluoride", std="BIS IS 10500", mn=None, acc=1.0, perm=1.5, q_acc=None),
        dict(param="Chloride", std="BIS IS 10500", mn=None, acc=250.0, perm=1000.0, q_acc=None),
        dict(param="Sulphate", std="BIS IS 10500", mn=None, acc=200.0, perm=400.0, q_acc=None),
        dict(param="Nitrate", std="BIS IS 10500", mn=None, acc=45.0, perm=100.0, q_acc=None),
        dict(param="Iron", std="BIS IS 10500", mn=None, acc=0.3, perm=1.0, q_acc=None),
        dict(param="Arsenic", std="BIS IS 10500", mn=None, acc=0.01, perm=0.05, q_acc=None),
        dict(param="Total Coliform", std="BIS IS 10500", mn=None, acc=None, perm=None, q_acc="NOT DETECTED"),
        dict(param="E. coli", std="BIS IS 10500", mn=None, acc=None, perm=None, q_acc="NOT DETECTED"),
        dict(param="Free Residual Chlorine", std="BIS IS 10500", mn=0.2, acc=1.0, perm=None, q_acc=None),
        dict(param="Colour", std="BIS IS 10500", mn=None, acc=5.0, perm=15.0, q_acc=None),
        dict(param="Ammonia", std="BIS IS 10500", mn=None, acc=0.5, perm=None, q_acc=None),
    ]
    for s in standards_data:
        param = param_map.get(s["param"])
        if not param:
            continue
        existing = db.query(WaterQualityStandard).filter(
            WaterQualityStandard.parameter_id == param.id,
            WaterQualityStandard.standard_type == s["std"],
        ).first()
        if not existing:
            obj = WaterQualityStandard(
                parameter_id=param.id, standard_type=s["std"],
                min_acceptable=s["mn"], acceptable_limit=s["acc"],
                permissible_limit=s["perm"], qualitative_acceptable=s["q_acc"],
                is_active=True,
            )
            db.add(obj)
    db.commit()
    print("  [STDS] BIS IS 10500 standards seeded")

    # ─────────────────────────────────────────────────────────────────────────
    # OFFICER RESPONSIBILITY MAPPING
    # ─────────────────────────────────────────────────────────────────────────
    from models.alert import OfficerResponsibility

    resp_data = [
        dict(src="MAS-OW-01", uid="hmi.user", role="HMI"),
        dict(src="MAS-OW-01", uid="engineering.user", role="ENGINEERING"),
        dict(src="MAS-OW-01", uid="station.user", role="STATION_INCHARGE"),
        dict(src="MAS-OW-01", uid="division.officer", role="DIVISIONAL_OFFICER"),
        dict(src="MAS-BW-01", uid="hmi.user", role="HMI"),
        dict(src="MAS-BW-01", uid="engineering.user", role="ENGINEERING"),
        dict(src="SA-BW-01", uid="DO-TPJ-001", role="DIVISIONAL_OFFICER"),
        dict(src="PGT-BW-01", uid="zonal.admin", role="ZONAL_ADMIN"),
    ]
    for r in resp_data:
        src = source_map.get(r["src"])
        usr = user_map.get(r["uid"])
        if src and usr:
            existing = db.query(OfficerResponsibility).filter(
                OfficerResponsibility.water_source_id == src.id,
                OfficerResponsibility.user_id == usr.id,
            ).first()
            if not existing:
                db.add(OfficerResponsibility(
                    water_source_id=src.id, user_id=usr.id,
                    role=r["role"], is_active=True,
                ))
    db.commit()
    print("  [RESP] Officer responsibilities mapped")

    # ─────────────────────────────────────────────────────────────────────────
    # DEMO SAMPLES + REPORTS (for existing UNFIT/UNSATISFACTORY/COMPLIANT demo)
    # ─────────────────────────────────────────────────────────────────────────
    lab_user = user_map.get("lab.user")
    central_lab = lab_map.get("SR-WTL")
    mas_lab = lab_map.get("MAS-WTL")

    def make_sample(sid, source_code, stype, days_ago, collector):
        existing = db.query(LabSample).filter(LabSample.sample_id == sid).first()
        if existing:
            return existing
        s = LabSample(
            sample_id=sid,
            water_source_id=source_map[source_code].id,
            sample_type=stype,
            collection_date=now - datetime.timedelta(days=days_ago),
            collector_name=collector,
            collector_user_id=lab_user.id if lab_user else None,
            status="RESULT_ENTERED",
        )
        db.add(s); db.flush()
        return s

    def make_report(rid, sample, lab_obj, lab_rpt_no, days_ago_rpt, result, entries):
        existing = db.query(LabReport).filter(LabReport.report_id == rid).first()
        if existing:
            return existing
        r = LabReport(
            report_id=rid,
            sample_id=sample.id,
            laboratory_id=lab_obj.id,
            lab_report_number=lab_rpt_no,
            report_date=now - datetime.timedelta(days=days_ago_rpt),
            overall_result=result,
            evaluation_done=True,
            evaluated_at=now - datetime.timedelta(days=days_ago_rpt),
            submitted_by_user_id=lab_user.id if lab_user else None,
        )
        db.add(r); db.flush()
        for e in entries:
            param = param_map.get(e["p"])
            if param:
                db.add(LabResultEntry(
                    report_id=r.id, parameter_id=param.id,
                    observed_value=e["v"], is_qualitative=param.is_qualitative,
                    parameter_status=e["s"],
                ))
        db.commit()
        return r

    # Demo 1: MAS-OW-01 UNFIT report (pre-seeded alert)
    s1 = make_sample("SMP-MAS-OW-001", "MAS-OW-01", "Bacteriological", 3, "Lab Tech SR")
    r1 = make_report(
        "RPT-DEMO-001", s1, central_lab, "SR-WTL/2024/B/001", 3, "UNFIT",
        [
            dict(p="Total Coliform", v="DETECTED", s="FAIL"),
            dict(p="E. coli", v="DETECTED", s="FAIL"),
            dict(p="pH", v="6.8", s="PASS"),
            dict(p="Turbidity", v="2.1", s="ACCEPTABLE"),
        ]
    )

    # Demo 2: SA-BW-01 UNSATISFACTORY report
    s2 = make_sample("SMP-SA-BW-001", "SA-BW-01", "Chemical", 8, "Lab Tech SR")
    r2 = make_report(
        "RPT-DEMO-002", s2, mas_lab, "MAS-WTL/2024/C/001", 8, "UNSATISFACTORY",
        [
            dict(p="Total Hardness", v="280", s="ACCEPTABLE"),
            dict(p="Total Dissolved Solids", v="520", s="ACCEPTABLE"),
            dict(p="pH", v="7.2", s="PASS"),
            dict(p="Chloride", v="260", s="ACCEPTABLE"),
        ]
    )

    # Demo 3: MAS-BW-01 FIT (for contrast)
    s3 = make_sample("SMP-MAS-BW-001", "MAS-BW-01", "Bacteriological", 10, "Lab Tech MAS")
    make_report(
        "RPT-DEMO-003", s3, central_lab, "SR-WTL/2024/B/002", 10, "FIT",
        [
            dict(p="Total Coliform", v="NOT DETECTED", s="PASS"),
            dict(p="E. coli", v="NOT DETECTED", s="PASS"),
            dict(p="pH", v="7.1", s="PASS"),
            dict(p="Turbidity", v="0.5", s="PASS"),
            dict(p="Free Residual Chlorine", v="0.3", s="PASS"),
        ]
    )

    # Demo 4: PGT-BW-01 PERSISTENT FAILURE
    for i, days in enumerate([45, 20, 5]):
        sid = f"SMP-PGT-BW-00{i+1}"
        rid = f"RPT-PGT-00{i+1}"
        si = make_sample(sid, "PGT-BW-01", "Bacteriological", days, "Lab Tech PGT")
        make_report(
            rid, si, central_lab, f"SR-WTL/2024/B/PGT-0{i+1}", days, "UNFIT",
            [dict(p="Total Coliform", v="DETECTED", s="FAIL"),
             dict(p="E. coli", v="DETECTED", s="FAIL")]
        )

    print("  [REPORTS] Demo lab reports seeded")

    # ─────────────────────────────────────────────────────────────────────────
    # DEMO ALERTS (auto-generate for pre-seeded UNFIT/UNSATISFACTORY sources)
    # ─────────────────────────────────────────────────────────────────────────
    from models.alert import Alert, AlertNotification
    from models.workflow import CorrectiveAction, RepeatSample
    from services.alert_engine import get_concerned_officers

    def make_alert(alert_id_str, report, source_code, result, status="OPEN",
                   is_escalated=False, ack_days=None):
        existing = db.query(Alert).filter(Alert.alert_id == alert_id_str).first()
        if existing:
            return existing

        from models.hierarchy import Zone as _Zone, Division as _Division, Station as _Station
        src = source_map[source_code]
        stn = db.query(_Station).filter(_Station.id == src.station_id).first()
        div = db.query(_Division).filter(_Division.id == stn.division_id).first() if stn else None
        zone = db.query(_Zone).filter(_Zone.id == div.zone_id).first() if div else None
        lab_obj = db.query(Laboratory).filter(Laboratory.id == report.laboratory_id).first()
        sample = db.query(LabSample).filter(LabSample.id == report.sample_id).first()

        fp_raw = [
            e for e in db.query(LabResultEntry).filter(
                LabResultEntry.report_id == report.id,
                LabResultEntry.parameter_status == "FAIL",
            ).all()
        ]
        fp_json = [
            {"name": param_map_rev.get(e.parameter_id, str(e.parameter_id)),
             "observed": e.observed_value, "limit": e.acceptable_limit, "status": "FAIL"}
            for e in fp_raw
        ]

        a = Alert(
            alert_id=alert_id_str,
            alert_type="WATER_QUALITY",
            severity="CRITICAL",
            lab_report_id=report.id,
            water_source_id=src.id,
            source_id_code=src.source_id_code,
            zone_name=zone.name if zone else "",
            division_name=div.name if div else "",
            station_name=stn.name if stn else "",
            source_type=src.source_type,
            sample_result=result,
            sample_date=sample.collection_date if sample else now,
            report_date=report.report_date,
            lab_name=lab_obj.name if lab_obj else "",
            failed_parameters=fp_json,
            remarks=f"Water source {src.source_id_code} returned {result} result.",
            status=status,
            due_date=now + datetime.timedelta(hours=48) if status == "OPEN" else now - datetime.timedelta(days=1),
            is_escalated=is_escalated,
            escalation_level=1 if is_escalated else 0,
            escalated_at=now - datetime.timedelta(days=1) if is_escalated else None,
            acknowledged_at=now - datetime.timedelta(days=ack_days) if ack_days else None,
            created_at=report.report_date or now,
        )
        db.add(a); db.flush()

        # Notifications
        officers = get_concerned_officers(db, src.id)
        for o in officers:
            db.add(AlertNotification(
                alert_id=a.id, user_id=o.id,
                recipient_name=o.name, recipient_role=o.role, recipient_email=o.email,
                status="SIMULATED", sent_at=now,
            ))

        # Corrective Action
        count = db.query(CorrectiveAction).count() + 1
        ca = CorrectiveAction(
            action_id=f"CA-2024-{count:04d}",
            alert_id=a.id, water_source_id=src.id,
            problem_description=f"Source {src.source_id_code}: {result} result detected.",
            failed_parameters=", ".join(fp["name"] for fp in fp_json),
            corrective_action_description=(
                "1. Immediately investigate the water source.\n"
                "2. Conduct thorough disinfection.\n"
                "3. Arrange repeat sample after corrective action."
            ),
            status="OPEN" if status in ("OPEN", "ACKNOWLEDGED") else "COMPLETED",
            target_date=now + datetime.timedelta(days=7),
            completed_date=now - datetime.timedelta(days=1) if status not in ("OPEN", "ACKNOWLEDGED") else None,
            created_at=a.created_at,
        )
        db.add(ca); db.flush()

        # Repeat Sample
        rs_count = db.query(RepeatSample).count() + 1
        db.add(RepeatSample(
            repeat_sample_id=f"RS-2024-{rs_count:04d}",
            alert_id=a.id, water_source_id=src.id,
            scheduled_date=now + datetime.timedelta(days=7),
            status="DUE" if status in ("OPEN", "ACKNOWLEDGED", "CORRECTIVE_ACTION") else "COLLECTED",
            created_at=a.created_at,
        ))
        db.commit()
        return a

    # Reverse param map
    param_map_rev = {v.id: k for k, v in param_map.items()}

    r1_fresh = db.query(LabReport).filter(LabReport.report_id == "RPT-DEMO-001").first()
    r2_fresh = db.query(LabReport).filter(LabReport.report_id == "RPT-DEMO-002").first()

    if r1_fresh:
        make_alert("ALT-2024-0001", r1_fresh, "MAS-OW-01", "UNFIT", "OPEN")
    if r2_fresh:
        make_alert("ALT-2024-0002", r2_fresh, "SA-BW-01", "UNSATISFACTORY", "ACKNOWLEDGED", ack_days=2)

    # Persistent failure alerts
    for i, rid in enumerate(["RPT-PGT-001", "RPT-PGT-002", "RPT-PGT-003"]):
        r = db.query(LabReport).filter(LabReport.report_id == rid).first()
        if r:
            make_alert(f"ALT-2024-PGT-{i+1:02d}", r, "PGT-BW-01", "UNFIT",
                      status="ESCALATED" if i == 2 else "CORRECTIVE_ACTION",
                      is_escalated=(i == 2))

    print("  [ALERTS] Demo alerts seeded")

    # ─────────────────────────────────────────────────────────────────────────
    # ESCALATION RULES
    # ─────────────────────────────────────────────────────────────────────────
    from models.workflow import EscalationRule

    rules = [
        dict(name="Critical UNFIT — 48h to Division", severity="CRITICAL",
             level=1, delay_hours=48, escalate_to_role="DIVISIONAL_OFFICER"),
        dict(name="Critical UNFIT — 96h to Zone", severity="CRITICAL",
             level=2, delay_hours=96, escalate_to_role="ZONAL_ADMIN"),
        dict(name="Persistent Failure — Central", severity="CRITICAL",
             level=3, delay_hours=120, escalate_to_role="CENTRAL_ADMIN"),
    ]
    for rule in rules:
        existing = db.query(EscalationRule).filter(EscalationRule.name == rule["name"]).first()
        if not existing:
            db.add(EscalationRule(**rule, alert_type="WATER_QUALITY", is_active=True))
    db.commit()
    print("  [RULES] Escalation rules seeded")

    # ─────────────────────────────────────────────────────────────────────────
    # AUDIT LOG — seed some initial events
    # ─────────────────────────────────────────────────────────────────────────
    from models.audit import AuditLog

    seed_logs = [
        dict(action="SYSTEM_INIT", entity_type="System", entity_id=0,
             entity_ref="IR-IWQMS", details="System initialized with demo data",
             user_name="SYSTEM", user_role="SYSTEM"),
        dict(action="RESULT_CREATED", entity_type="LabReport", entity_id=1,
             entity_ref="RPT-DEMO-001", details="Demo UNFIT report created",
             user_name="Lab Technician SR", user_role="LABORATORY"),
        dict(action="ALERT_CREATED", entity_type="Alert", entity_id=1,
             entity_ref="ALT-2024-0001",
             details="Auto-created CRITICAL alert for UNFIT result on MAS-OW-01",
             user_name="SYSTEM", user_role="SYSTEM"),
    ]
    if db.query(AuditLog).count() == 0:
        for log in seed_logs:
            db.add(AuditLog(**log, created_at=now))
        db.commit()

    print("\n[SEED] Complete!")
    print("=" * 50)
    print("Demo Logins:")
    print("  central.admin      / admin123  (Central Admin)")
    print("  zonal.admin        / admin123  (Zonal Admin)")
    print("  division.officer   / admin123  (Divisional Officer)")
    print("  hmi.user           / admin123  (H&MI)")
    print("  engineering.user   / admin123  (Engineering)")
    print("  lab.user           / admin123  (Laboratory)")
    print("  station.user       / admin123  (Station Incharge)")
    print("  management.user    / admin123  (Senior Management)")
    print("=" * 50)
    print("Demo Alerts: ALT-2024-0001 (UNFIT), ALT-2024-0002 (UNSATISFACTORY)")


if __name__ == "__main__":
    try:
        seed_all()
    finally:
        db.close()
