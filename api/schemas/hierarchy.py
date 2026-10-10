from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# --- Zone ---
class ZoneBase(BaseModel):
    name: str
    code: str

class ZoneCreate(ZoneBase):
    pass

class Zone(ZoneBase):
    id: int
    class Config:
        from_attributes = True

# --- Division ---
class DivisionBase(BaseModel):
    name: str
    code: str
    zone_id: int

class DivisionCreate(DivisionBase):
    pass

class Division(DivisionBase):
    id: int
    class Config:
        from_attributes = True

# --- Station ---
class StationBase(BaseModel):
    name: str
    code: str
    category: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_long: Optional[float] = None
    division_id: int
    
    source_provenance: Optional[str] = "DEMONSTRATION DATA"
    dataset_version: Optional[str] = None
    imported_at: Optional[datetime] = None
    last_verified_at: Optional[datetime] = None

class StationCreate(StationBase):
    pass

class Station(StationBase):
    id: int
    class Config:
        from_attributes = True

# --- Water Source ---
class WaterSourceBase(BaseModel):
    source_id_code: str
    source_type: Optional[str] = None
    capacity: Optional[str] = None
    areas_supplied: Optional[str] = None
    population_served: Optional[int] = None
    storage_tank: Optional[str] = None
    treatment_facility: Optional[str] = None
    disinfection_method: Optional[str] = None
    disinfection_frequency_days: Optional[int] = 30
    gps_lat: Optional[float] = None
    gps_long: Optional[float] = None
    station_id: int

class WaterSourceCreate(WaterSourceBase):
    pass

class WaterSource(WaterSourceBase):
    id: int
    current_status: str
    consecutive_failures: int
    total_failures: int
    last_bacteriological_sample_date: Optional[datetime] = None
    last_chemical_sample_date: Optional[datetime] = None
    next_bacteriological_sample_due: Optional[datetime] = None
    next_chemical_sample_due: Optional[datetime] = None
    last_disinfection_date: Optional[datetime] = None
    next_disinfection_due: Optional[datetime] = None
    residual_chlorine_last: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

