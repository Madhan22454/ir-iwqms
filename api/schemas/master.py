from pydantic import BaseModel
from typing import Optional

# --- Parameter ---
class ParameterBase(BaseModel):
    name: str
    category: Optional[str] = None
    unit: Optional[str] = None

class ParameterCreate(ParameterBase):
    pass

class Parameter(ParameterBase):
    id: int
    class Config:
        from_attributes = True

# --- Water Quality Standard ---
class WaterQualityStandardBase(BaseModel):
    parameter_id: int
    standard_type: Optional[str] = None
    acceptable_limit: Optional[float] = None
    permissible_limit: Optional[float] = None
    is_active: bool = True

class WaterQualityStandardCreate(WaterQualityStandardBase):
    pass

class WaterQualityStandard(WaterQualityStandardBase):
    id: int
    class Config:
        from_attributes = True
