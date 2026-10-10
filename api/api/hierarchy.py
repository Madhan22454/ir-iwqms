from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from api.deps import get_db, CurrentUser
from models.hierarchy import Zone, Division, Station, WaterSource
from schemas.hierarchy import (
    Zone as ZoneSchema, ZoneCreate,
    Division as DivisionSchema, DivisionCreate,
    Station as StationSchema, StationCreate,
    WaterSource as WaterSourceSchema, WaterSourceCreate
)

router = APIRouter()

# --- Zone ---
@router.post("/zones/", response_model=ZoneSchema)
def create_zone(zone: ZoneCreate, db: Session = Depends(get_db)):
    db_zone = Zone(**zone.model_dump())
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)
    return db_zone

@router.get("/zones/", response_model=List[ZoneSchema])
def read_zones(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db), current_user: CurrentUser = None):
    q = db.query(Zone)
    if current_user and current_user.role == "ZONAL_ADMIN" and current_user.zone_id:
        q = q.filter(Zone.id == current_user.zone_id)
    return q.offset(skip).limit(limit).all()

# --- Division ---
@router.post("/divisions/", response_model=DivisionSchema)
def create_division(division: DivisionCreate, db: Session = Depends(get_db)):
    db_div = Division(**division.model_dump())
    db.add(db_div)
    db.commit()
    db.refresh(db_div)
    return db_div

@router.get("/divisions/", response_model=List[DivisionSchema])
def read_divisions(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db), current_user: CurrentUser = None):
    q = db.query(Division)
    if current_user:
        if current_user.role == "ZONAL_ADMIN" and current_user.zone_id:
            q = q.filter(Division.zone_id == current_user.zone_id)
        elif current_user.role == "DIVISIONAL_OFFICER" and current_user.division_id:
            q = q.filter(Division.id == current_user.division_id)
    return q.offset(skip).limit(limit).all()

# --- Station ---
@router.post("/stations/", response_model=StationSchema)
def create_station(station: StationCreate, db: Session = Depends(get_db)):
    db_station = Station(**station.model_dump())
    db.add(db_station)
    db.commit()
    db.refresh(db_station)
    return db_station

@router.get("/stations/", response_model=List[StationSchema])
def read_stations(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db), current_user: CurrentUser = None):
    q = db.query(Station)
    if current_user:
        if current_user.role == "ZONAL_ADMIN" and current_user.zone_id:
            q = q.join(Division).filter(Division.zone_id == current_user.zone_id)
        elif current_user.role == "DIVISIONAL_OFFICER" and current_user.division_id:
            q = q.filter(Station.division_id == current_user.division_id)
        elif current_user.role == "STATION_INCHARGE" and current_user.station_id:
            q = q.filter(Station.id == current_user.station_id)
    return q.offset(skip).limit(limit).all()

# --- Water Source ---
@router.post("/water-sources/", response_model=WaterSourceSchema)
def create_water_source(source: WaterSourceCreate, current_user: CurrentUser, db: Session = Depends(get_db)):

    # Validate that the referenced station exists
    station = db.query(Station).filter(Station.id == source.station_id).first()
    if not station:
        raise HTTPException(status_code=400, detail="Referenced station does not exist")
        
    # Enforce role-based scoping
    if current_user.role == "ZONAL_ADMIN":
        if not station.division or station.division.zone_id != current_user.zone_id:
            raise HTTPException(status_code=403, detail="Not authorized to create water sources for this zone")
    elif current_user.role == "DIVISIONAL_OFFICER":
        if station.division_id != current_user.division_id:
            raise HTTPException(status_code=403, detail="Not authorized to create water sources for this division")
    elif current_user.role == "STATION_INCHARGE":
        if station.id != current_user.station_id:
            raise HTTPException(status_code=403, detail="Not authorized to create water sources for this station")
    elif current_user.role == "CENTRAL_ADMIN":
        pass
    else:
        raise HTTPException(status_code=403, detail="Role not authorized to create water sources")

    # Pre-insert check for friendly error
    existing = db.query(WaterSource).filter(WaterSource.source_id_code == source.source_id_code).first()
    if existing:
        raise HTTPException(status_code=409, detail="Water source with this ID code already exists")

    db_source = WaterSource(**source.model_dump())
    db.add(db_source)
    try:
        db.commit()
        db.refresh(db_source)
        return db_source
    except IntegrityError as e:
        db.rollback()
        is_unique_violation = False
        if hasattr(e.orig, "pgcode") and e.orig.pgcode == "23505":
            is_unique_violation = True
        elif "unique" in str(e).lower() or "duplicate" in str(e).lower():
            is_unique_violation = True
            
        if is_unique_violation:
            raise HTTPException(status_code=409, detail="Water source with this ID code already exists")
        raise HTTPException(status_code=400, detail="Database integrity error")


@router.get("/water-sources/", response_model=List[WaterSourceSchema])
def read_water_sources(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db), current_user: CurrentUser = None):
    q = db.query(WaterSource)
    if current_user:
        if current_user.role == "ZONAL_ADMIN" and current_user.zone_id:
            q = q.join(Station).join(Division).filter(Division.zone_id == current_user.zone_id)
        elif current_user.role == "DIVISIONAL_OFFICER" and current_user.division_id:
            q = q.join(Station).filter(Station.division_id == current_user.division_id)
        elif current_user.role == "STATION_INCHARGE" and current_user.station_id:
            q = q.filter(WaterSource.station_id == current_user.station_id)
    return q.offset(skip).limit(limit).all()
