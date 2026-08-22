from pydantic import BaseModel
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
    storage_tank: Optional[str] = None
    treatment_facility: Optional[str] = None
    disinfection_method: Optional[str] = None
    station_id: int
    
    current_status: str = "COMPLIANT"
    last_bacteriological_sample_date: Optional[datetime] = None
    last_chemical_sample_date: Optional[datetime] = None
    next_bacteriological_sample_due: Optional[datetime] = None
    next_chemical_sample_due: Optional[datetime] = None
    last_disinfection_date: Optional[datetime] = None
    next_disinfection_due: Optional[datetime] = None

class WaterSourceCreate(WaterSourceBase):
    pass

class WaterSource(WaterSourceBase):
    id: int
    class Config:
        from_attributes = True
