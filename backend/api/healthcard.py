from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

from api.deps import get_db
from models.hierarchy import WaterSource, Station, Division, Zone
from models.alert import Alert

router = APIRouter()

class HealthCardResponse(BaseModel):
    water_source_id: int
    source_id_code: str
    source_type: Optional[str] = None
    capacity: Optional[str] = None
    areas_supplied: Optional[str] = None
    population_served: Optional[int] = None
    disinfection_method: Optional[str] = None
    residual_chlorine_last: Optional[float] = None
    consecutive_failures: int = 0
    total_failures: int = 0
    station_name: str
    division_name: str
    zone_name: str
    status: str
    last_bacteriological_date: Optional[datetime] = None
    next_bacteriological_due: Optional[datetime] = None
    last_chemical_date: Optional[datetime] = None
    next_chemical_due: Optional[datetime] = None
    last_disinfection_date: Optional[datetime] = None
    next_disinfection_due: Optional[datetime] = None
    active_alerts_count: int = 0
    latest_alert_id: Optional[str] = None

@router.get("/healthcard/{source_id}", response_model=HealthCardResponse)
def get_health_card(source_id: int, db: Session = Depends(get_db)):
    source = db.query(WaterSource).filter(WaterSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Water source not found")
        
    station = db.query(Station).filter(Station.id == source.station_id).first()
    division = db.query(Division).filter(Division.id == station.division_id).first() if station else None
    zone = db.query(Zone).filter(Zone.id == division.zone_id).first() if division else None
    
    alerts = db.query(Alert).filter(
        Alert.water_source_id == source.id,
        Alert.status.in_(["OPEN", "ACKNOWLEDGED", "CORRECTIVE_ACTION", "REPEAT_SAMPLE", "VERIFICATION", "ESCALATED"])
    ).all()
    latest_alert = alerts[0].alert_id if alerts else None
    
    return HealthCardResponse(
        water_source_id=source.id,
        source_id_code=source.source_id_code,
        source_type=source.source_type,
        capacity=source.capacity,
        areas_supplied=source.areas_supplied,
        population_served=source.population_served,
        disinfection_method=source.disinfection_method,
        residual_chlorine_last=source.residual_chlorine_last,
        consecutive_failures=source.consecutive_failures or 0,
        total_failures=source.total_failures or 0,
        station_name=station.name if station else "Unknown",
        division_name=division.name if division else "Unknown",
        zone_name=zone.name if zone else "Unknown",
        status=source.current_status,
        last_bacteriological_date=source.last_bacteriological_sample_date,
        next_bacteriological_due=source.next_bacteriological_sample_due,
        last_chemical_date=source.last_chemical_sample_date,
        next_chemical_due=source.next_chemical_sample_due,
        last_disinfection_date=source.last_disinfection_date,
        next_disinfection_due=source.next_disinfection_due,
        active_alerts_count=len(alerts),
        latest_alert_id=latest_alert,
    )

@router.get("/healthcard/station/{station_id}", response_model=List[HealthCardResponse])
def get_station_health_cards(station_id: int, db: Session = Depends(get_db)):
    sources = db.query(WaterSource).filter(WaterSource.station_id == station_id).all()
    results = []
    
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
        
    division = db.query(Division).filter(Division.id == station.division_id).first()
    zone = db.query(Zone).filter(Zone.id == division.zone_id).first() if division else None
    
    for source in sources:
        alerts = db.query(Alert).filter(
            Alert.water_source_id == source.id,
            Alert.status.in_(["OPEN", "ACKNOWLEDGED", "CORRECTIVE_ACTION", "REPEAT_SAMPLE", "VERIFICATION", "ESCALATED"])
        ).all()
        latest_alert = alerts[0].alert_id if alerts else None

        results.append(HealthCardResponse(
            water_source_id=source.id,
            source_id_code=source.source_id_code,
            source_type=source.source_type,
            capacity=source.capacity,
            areas_supplied=source.areas_supplied,
            population_served=source.population_served,
            disinfection_method=source.disinfection_method,
            residual_chlorine_last=source.residual_chlorine_last,
            consecutive_failures=source.consecutive_failures or 0,
            total_failures=source.total_failures or 0,
            station_name=station.name,
            division_name=division.name if division else "Unknown",
            zone_name=zone.name if zone else "Unknown",
            status=source.current_status,
            last_bacteriological_date=source.last_bacteriological_sample_date,
            next_bacteriological_due=source.next_bacteriological_sample_due,
            last_chemical_date=source.last_chemical_sample_date,
            next_chemical_due=source.next_chemical_sample_due,
            last_disinfection_date=source.last_disinfection_date,
            next_disinfection_due=source.next_disinfection_due,
            active_alerts_count=len(alerts),
            latest_alert_id=latest_alert,
        ))
        
    return results
