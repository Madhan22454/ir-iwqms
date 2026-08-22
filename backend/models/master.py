from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class Parameter(Base):
    __tablename__ = "parameters"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    category = Column(String)           # Chemical, Bacteriological, Physical
    unit = Column(String)
    is_qualitative = Column(Boolean, default=False)  # True for coliform (DETECTED/NOT DETECTED)
    display_order = Column(Integer, default=99)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    standards = relationship("WaterQualityStandard", back_populates="parameter")


class WaterQualityStandard(Base):
    __tablename__ = "water_quality_standards"
    id = Column(Integer, primary_key=True, index=True)
    parameter_id = Column(Integer, ForeignKey("parameters.id"))
    standard_type = Column(String)              # BIS IS 10500, WHO, ICMR
    min_acceptable = Column(Float, nullable=True)  # min (e.g. pH >= 6.5)
    acceptable_limit = Column(Float, nullable=True) # max acceptable
    permissible_limit = Column(Float, nullable=True)# max permissible
    qualitative_acceptable = Column(String, nullable=True)  # "NOT DETECTED" for coliform
    is_active = Column(Boolean, default=True)

    parameter = relationship("Parameter", back_populates="standards")
