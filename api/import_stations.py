import csv
import sys
import os
import datetime
from sqlalchemy.orm import Session
from database import engine, SessionLocal
from models.hierarchy import Station, Division, Zone

def import_stations_from_csv(csv_path: str, provenance: str = "OFFICIAL_IR_DATASET"):
    print(f"Starting import from {csv_path} with provenance {provenance}")
    if not os.path.exists(csv_path):
        print("Error: CSV file not found.")
        return

    db = SessionLocal()
    
    total_records = 0
    imported = 0
    updated = 0
    skipped = 0
    duplicates = 0
    invalid_coordinates = 0
    missing_fields = 0
    
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_records += 1
            code = row.get("code", "").strip()
            name = row.get("name", "").strip()
            div_code = row.get("division", "").strip()
            zone_code = row.get("zone", "").strip()
            lat_str = row.get("latitude", "").strip()
            lng_str = row.get("longitude", "").strip()
            
            if not code or not name:
                missing_fields += 1
                print(f"Warning: Skipping record {total_records} due to missing code or name.")
                continue
                
            try:
                lat = float(lat_str) if lat_str else None
                lng = float(lng_str) if lng_str else None
                if lat is not None and (lat < -90 or lat > 90):
                    raise ValueError("Invalid latitude")
                if lng is not None and (lng < -180 or lng > 180):
                    raise ValueError("Invalid longitude")
            except ValueError:
                invalid_coordinates += 1
                print(f"Warning: Invalid coordinates for station {code}. Skipping.")
                skipped += 1
                continue
                
            # Lookup Division
            division = db.query(Division).filter(Division.code == div_code).first()
            if not division and div_code:
                # Optionally create or skip. We skip if division is strictly required, but let's allow it if we can.
                print(f"Warning: Division {div_code} not found for station {code}.")
            
            existing = db.query(Station).filter(Station.code == code).first()
            if existing:
                if existing.source_provenance == provenance:
                    duplicates += 1
                else:
                    existing.name = name
                    existing.gps_lat = lat
                    existing.gps_long = lng
                    if division:
                        existing.division_id = division.id
                    existing.source_provenance = provenance
                    existing.imported_at = datetime.datetime.utcnow()
                    updated += 1
            else:
                new_station = Station(
                    code=code,
                    name=name,
                    gps_lat=lat,
                    gps_long=lng,
                    division_id=division.id if division else None,
                    source_provenance=provenance,
                    imported_at=datetime.datetime.utcnow()
                )
                db.add(new_station)
                imported += 1
                
        db.commit()
        db.close()
        
    print("====================================")
    print("          IMPORT REPORT")
    print("====================================")
    print(f"Total records      : {total_records}")
    print(f"Imported           : {imported}")
    print(f"Updated            : {updated}")
    print(f"Skipped            : {skipped}")
    print(f"Duplicates         : {duplicates}")
    print(f"Invalid coordinates: {invalid_coordinates}")
    print(f"Missing req fields : {missing_fields}")
    print("====================================")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_stations.py <path_to_csv> [provenance]")
    else:
        path = sys.argv[1]
        prov = sys.argv[2] if len(sys.argv) > 2 else "OFFICIAL_IR_DATASET"
        import_stations_from_csv(path, prov)
