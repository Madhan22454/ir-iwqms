from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime


class Zone(Base):
    __tablename__ = "zones"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    code = Column(String, unique=True, index=True)

    divisions = relationship("Division", back_populates="zone")


class Division(Base):
    __tablename__ = "divisions"
    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"))
    name = Column(String, index=True)
    code = Column(String, unique=True, index=True)

    zone = relationship("Zone", back_populates="divisions")
    stations = relationship("Station", back_populates="division")


class Station(Base):
    __tablename__ = "stations"
    id = Column(Integer, primary_key=True, index=True)
    division_id = Column(Integer, ForeignKey("divisions.id"))
    name = Column(String, index=True)
    code = Column(String, unique=True, index=True)
    category = Column(String)
    gps_lat = Column(Float, nullable=True)
    gps_long = Column(Float, nullable=True)

    division = relationship("Division", back_populates="stations")
    water_sources = relationship("WaterSource", back_populates="station")


class WaterSource(Base):
    __tablename__ = "water_sources"
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"))
    source_id_code = Column(String, unique=True, index=True)
    source_type = Column(String)
    capacity = Column(String)
    areas_supplied = Column(String)
    population_served = Column(Integer, nullable=True)
    storage_tank = Column(String)
    treatment_facility = Column(String)
    disinfection_method = Column(String)
    disinfection_frequency_days = Column(Integer, default=30)

    # GPS (source-level override; if null, use station GPS)
    gps_lat = Column(Float, nullable=True)
    gps_long = Column(Float, nullable=True)

    # Status
    current_status = Column(String, default="COMPLIANT")
    # COMPLIANT, UNFIT, UNSATISFACTORY, DUE, OVERDUE, PERSISTENT_FAILURE

    # Failure tracking for persistent failure
    consecutive_failures = Column(Integer, default=0)
    total_failures = Column(Integer, default=0)

    # Sampling dates
    last_bacteriological_sample_date = Column(DateTime, nullable=True)
    last_chemical_sample_date = Column(DateTime, nullable=True)
    next_bacteriological_sample_due = Column(DateTime, nullable=True)
    next_chemical_sample_due = Column(DateTime, nullable=True)

    # Disinfection
    last_disinfection_date = Column(DateTime, nullable=True)
    next_disinfection_due = Column(DateTime, nullable=True)
    residual_chlorine_last = Column(Float, nullable=True)

    station = relationship("Station", back_populates="water_sources")
