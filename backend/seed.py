"""
Seed script to populate the IR-IWQMS database with sample data.
Run from the backend/ directory:
    python seed.py
"""
import sys
import os

# Ensure the backend directory is on the path
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine, Base
from models import user, hierarchy, master  # noqa: F401 â€” ensure all models registered
from models.user import User, UserRole
from models.hierarchy import Zone, Division, Station, WaterSource
from models.master import Parameter, WaterQualityStandard
from core.security import get_password_hash
from datetime import datetime, timedelta

# Create all tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed_all():
    print("Seeding database...")

    # â”€â”€ Admin User â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if not db.query(User).filter(User.employee_id == "ADMIN001").first():
        admin = User(
            employee_id="ADMIN001",
            name="Central Admin",
            email="admin@ir-iwqms.in",
            mobile_number="9000000001",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.CENTRAL_ADMIN,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print("  âœ“ Admin user created (ADMIN001 / admin123)")
    else:
        print("  â€“ Admin user already exists")

    # â”€â”€ Zones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    zone_data = [
        {"name": "Southern Railway", "code": "SR"},
        {"name": "Western Railway", "code": "WR"},
        {"name": "Northern Railway", "code": "NR"},
    ]
    zones = {}
    for z in zone_data:
        existing = db.query(Zone).filter(Zone.code == z["code"]).first()
        if not existing:
            zone = Zone(**z)
            db.add(zone)
            db.commit()
            db.refresh(zone)
            zones[z["code"]] = zone
            print(f"  âœ“ Zone: {z['name']}")
        else:
            zones[z["code"]] = existing

    # â”€â”€ Divisions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    division_data = [
        {"name": "Chennai Division", "code": "MAS", "zone_code": "SR"},
        {"name": "Trichy Division", "code": "TPJ", "zone_code": "SR"},
        {"name": "Mumbai Division", "code": "BCT", "zone_code": "WR"},
        {"name": "Delhi Division", "code": "DLI", "zone_code": "NR"},
    ]
    divisions = {}
    for d in division_data:
        existing = db.query(Division).filter(Division.code == d["code"]).first()
        if not existing:
            div = Division(
                name=d["name"],
                code=d["code"],
                zone_id=zones[d["zone_code"]].id,
            )
            db.add(div)
            db.commit()
            db.refresh(div)
            divisions[d["code"]] = div
            print(f"  âœ“ Division: {d['name']}")
        else:
            divisions[d["code"]] = existing

    # â”€â”€ Stations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    station_data = [
        {"name": "Chennai Central", "code": "MAS", "category": "A1", "div": "MAS", "lat": 13.0827, "lng": 80.2707},
        {"name": "Tambaram", "code": "TBM", "category": "B", "div": "MAS", "lat": 12.9249, "lng": 80.1000},
        {"name": "Trichy Junction", "code": "TPJ", "category": "A", "div": "TPJ", "lat": 10.8050, "lng": 78.8140},
        {"name": "Mumbai Central", "code": "BCT", "category": "A1", "div": "BCT", "lat": 18.9697, "lng": 72.8194},
        {"name": "New Delhi", "code": "NDLS", "category": "A1", "div": "DLI", "lat": 28.6428, "lng": 77.2197},
    ]
    stations = {}
    for s in station_data:
        existing = db.query(Station).filter(Station.code == s["code"]).first()
        if not existing:
            station = Station(
                name=s["name"],
                code=s["code"],
                category=s["category"],
                division_id=divisions[s["div"]].id,
                gps_lat=s["lat"],
                gps_long=s["lng"],
            )
            db.add(station)
            db.commit()
            db.refresh(station)
            stations[s["code"]] = station
            print(f"  âœ“ Station: {s['name']}")
        else:
            stations[s["code"]] = existing

    # â”€â”€ Water Sources â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    now = datetime.utcnow()
    water_source_data = [
        {
            "source_id_code": "MAS-BW-01",
            "station_code": "MAS",
            "source_type": "Borewell",
            "capacity": "50,000 L/day",
            "areas_supplied": "Platform 1-5, Waiting Hall",
            "storage_tank": "Yes - 2 x 25,000 L",
            "treatment_facility": "Chlorination Plant",
            "disinfection_method": "Chlorination",
            "current_status": "COMPLIANT",
            "last_bacteriological_sample_date": now - timedelta(days=10),
            "next_bacteriological_sample_due": now + timedelta(days=20),
            "last_chemical_sample_date": now - timedelta(days=25),
            "next_chemical_sample_due": now + timedelta(days=65),
            "last_disinfection_date": now - timedelta(days=5),
            "next_disinfection_due": now + timedelta(days=25),
        },
        {
            "source_id_code": "MAS-OW-01",
            "station_code": "MAS",
            "source_type": "Open Well",
            "capacity": "20,000 L/day",
            "areas_supplied": "Goods Shed, Loco Workshop",
            "storage_tank": "Yes - 1 x 20,000 L",
            "treatment_facility": "None",
            "disinfection_method": "Bleaching Powder",
            "current_status": "UNSATISFACTORY",
            "last_bacteriological_sample_date": now - timedelta(days=45),
            "next_bacteriological_sample_due": now - timedelta(days=15),
            "last_chemical_sample_date": now - timedelta(days=100),
            "next_chemical_sample_due": now - timedelta(days=10),
            "last_disinfection_date": now - timedelta(days=40),
            "next_disinfection_due": now - timedelta(days=10),
        },
        {
            "source_id_code": "TBM-PL-01",
            "station_code": "TBM",
            "source_type": "Pipeline (CMWSSB)",
            "capacity": "30,000 L/day",
            "areas_supplied": "Platform 1-3, Staff Quarters",
            "storage_tank": "Yes - 1 x 30,000 L",
            "treatment_facility": "None",
            "disinfection_method": "Chlorination",
            "current_status": "COMPLIANT",
            "last_bacteriological_sample_date": now - timedelta(days=5),
            "next_bacteriological_sample_due": now + timedelta(days=25),
            "last_chemical_sample_date": now - timedelta(days=20),
            "next_chemical_sample_due": now + timedelta(days=70),
            "last_disinfection_date": now - timedelta(days=3),
            "next_disinfection_due": now + timedelta(days=27),
        },
        {
            "source_id_code": "TPJ-BW-01",
            "station_code": "TPJ",
            "source_type": "Borewell",
            "capacity": "40,000 L/day",
            "areas_supplied": "All Platforms, Catering Units",
            "storage_tank": "Yes - 2 x 20,000 L",
            "treatment_facility": "UV Treatment",
            "disinfection_method": "Chlorination + UV",
            "current_status": "UNFIT",
            "last_bacteriological_sample_date": now - timedelta(days=3),
            "next_bacteriological_sample_due": now + timedelta(days=27),
            "last_chemical_sample_date": now - timedelta(days=15),
            "next_chemical_sample_due": now + timedelta(days=75),
            "last_disinfection_date": now - timedelta(days=60),
            "next_disinfection_due": now - timedelta(days=30),
        },
        {
            "source_id_code": "BCT-PL-01",
            "station_code": "BCT",
            "source_type": "Pipeline (MCGM)",
            "capacity": "1,00,000 L/day",
            "areas_supplied": "All Platforms, Offices, Catering",
            "storage_tank": "Yes - 4 x 25,000 L",
            "treatment_facility": "RO Plant",
            "disinfection_method": "Chlorination + RO",
            "current_status": "COMPLIANT",
            "last_bacteriological_sample_date": now - timedelta(days=2),
            "next_bacteriological_sample_due": now + timedelta(days=28),
            "last_chemical_sample_date": now - timedelta(days=8),
            "next_chemical_sample_due": now + timedelta(days=82),
            "last_disinfection_date": now - timedelta(days=1),
            "next_disinfection_due": now + timedelta(days=29),
        },
        {
            "source_id_code": "NDLS-BW-01",
            "station_code": "NDLS",
            "source_type": "Borewell",
            "capacity": "80,000 L/day",
            "areas_supplied": "Platform 1-8, VIP Lounge",
            "storage_tank": "Yes - 4 x 20,000 L",
            "treatment_facility": "Filtration + Chlorination",
            "disinfection_method": "Chlorination",
            "current_status": "OVERDUE",
            "last_bacteriological_sample_date": now - timedelta(days=60),
            "next_bacteriological_sample_due": now - timedelta(days=30),
            "last_chemical_sample_date": now - timedelta(days=120),
            "next_chemical_sample_due": now - timedelta(days=30),
            "last_disinfection_date": now - timedelta(days=80),
            "next_disinfection_due": now - timedelta(days=50),
        },
    ]

    for ws in water_source_data:
        existing = db.query(WaterSource).filter(
            WaterSource.source_id_code == ws["source_id_code"]
        ).first()
        if not existing:
            station_code = ws.pop("station_code")
            ws["station_id"] = stations[station_code].id
            source = WaterSource(**ws)
            db.add(source)
            db.commit()
            print(f"  âœ“ Water Source: {ws['source_id_code']}")
        else:
            print(f"  â€“ Water Source already exists: {ws['source_id_code']}")

    # â”€â”€ Parameters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    parameter_data = [
        {"name": "pH", "category": "Chemical", "unit": "pH units"},
        {"name": "Turbidity", "category": "Chemical", "unit": "NTU"},
        {"name": "Total Dissolved Solids", "category": "Chemical", "unit": "mg/L"},
        {"name": "Chloride", "category": "Chemical", "unit": "mg/L"},
        {"name": "Hardness", "category": "Chemical", "unit": "mg/L"},
        {"name": "Total Coliform", "category": "Bacteriological", "unit": "MPN/100mL"},
        {"name": "E. coli", "category": "Bacteriological", "unit": "MPN/100mL"},
        {"name": "Residual Chlorine", "category": "Chemical", "unit": "mg/L"},
        {"name": "Nitrate", "category": "Chemical", "unit": "mg/L"},
        {"name": "Fluoride", "category": "Chemical", "unit": "mg/L"},
    ]
    parameters = {}
    for p in parameter_data:
        existing = db.query(Parameter).filter(Parameter.name == p["name"]).first()
        if not existing:
            param = Parameter(**p)
            db.add(param)
            db.commit()
            db.refresh(param)
            parameters[p["name"]] = param
            print(f"  âœ“ Parameter: {p['name']}")
        else:
            parameters[p["name"]] = existing

    # â”€â”€ Quality Standards (BIS IS 10500) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    standard_data = [
        {"parameter": "pH", "type": "BIS IS 10500", "acceptable": 6.5, "permissible": 8.5},
        {"parameter": "Turbidity", "type": "BIS IS 10500", "acceptable": 1.0, "permissible": 5.0},
        {"parameter": "Total Dissolved Solids", "type": "BIS IS 10500", "acceptable": 500.0, "permissible": 2000.0},
        {"parameter": "Chloride", "type": "BIS IS 10500", "acceptable": 250.0, "permissible": 1000.0},
        {"parameter": "Hardness", "type": "BIS IS 10500", "acceptable": 200.0, "permissible": 600.0},
        {"parameter": "Total Coliform", "type": "BIS IS 10500", "acceptable": 0.0, "permissible": 0.0},
        {"parameter": "E. coli", "type": "BIS IS 10500", "acceptable": 0.0, "permissible": 0.0},
        {"parameter": "Residual Chlorine", "type": "BIS IS 10500", "acceptable": 0.2, "permissible": 1.0},
        {"parameter": "Nitrate", "type": "BIS IS 10500", "acceptable": 45.0, "permissible": 100.0},
        {"parameter": "Fluoride", "type": "BIS IS 10500", "acceptable": 1.0, "permissible": 1.5},
    ]
    for s in standard_data:
        param = parameters.get(s["parameter"])
        if param:
            existing = db.query(WaterQualityStandard).filter(
                WaterQualityStandard.parameter_id == param.id,
                WaterQualityStandard.standard_type == s["type"]
            ).first()
            if not existing:
                std = WaterQualityStandard(
                    parameter_id=param.id,
                    standard_type=s["type"],
                    acceptable_limit=s["acceptable"],
                    permissible_limit=s["permissible"],
                    is_active=True,
                )
                db.add(std)
                db.commit()
                print(f"  âœ“ Standard: {s['parameter']} ({s['type']})")

    print("\nâœ… Seeding complete!")
    print("   Login: employee_id=ADMIN001, password=admin123")

if __name__ == "__main__":
    try:
        seed_all()
    finally:
        db.close()

