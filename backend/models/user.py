from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from enum import Enum
import enum

class UserRole(str, enum.Enum):
    CENTRAL_ADMIN = "CENTRAL_ADMIN"
    ZONAL_ADMIN = "ZONAL_ADMIN"
    DIVISIONAL_OFFICER = "DIVISIONAL_OFFICER"
    HMI = "HMI"
    ENGINEERING = "ENGINEERING"
    LABORATORY = "LABORATORY"
    STATION_INCHARGE = "STATION_INCHARGE"
    SENIOR_MANAGEMENT = "SENIOR_MANAGEMENT"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    mobile_number = Column(String)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False) # Store Enum as string
    
    # Hierarchy mappings (can be null for higher roles)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    division_id = Column(Integer, ForeignKey("divisions.id"), nullable=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=True)
    
    is_active = Column(Boolean, default=True)

    zone = relationship("Zone")
    division = relationship("Division")
    station = relationship("Station")
