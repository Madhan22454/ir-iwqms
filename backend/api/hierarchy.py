from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
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
def read_zones(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: CurrentUser = None):
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
def read_divisions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: CurrentUser = None):
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
def read_stations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: CurrentUser = None):
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
def create_water_source(source: WaterSourceCreate, db: Session = Depends(get_db)):
    db_source = WaterSource(**source.model_dump())
    db.add(db_source)
    db.commit()
    db.refresh(db_source)
    return db_source

@router.get("/water-sources/", response_model=List[WaterSourceSchema])
def read_water_sources(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: CurrentUser = None):
    q = db.query(WaterSource)
    if current_user:
        if current_user.role == "ZONAL_ADMIN" and current_user.zone_id:
            q = q.join(Station).join(Division).filter(Division.zone_id == current_user.zone_id)
        elif current_user.role == "DIVISIONAL_OFFICER" and current_user.division_id:
            q = q.join(Station).filter(Station.division_id == current_user.division_id)
        elif current_user.role == "STATION_INCHARGE" and current_user.station_id:
            q = q.filter(WaterSource.station_id == current_user.station_id)
    return q.offset(skip).limit(limit).all()
