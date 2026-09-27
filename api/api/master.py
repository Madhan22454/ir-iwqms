from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from api.deps import get_db
from models.master import Parameter, WaterQualityStandard
from schemas.master import (
    Parameter as ParameterSchema, ParameterCreate,
    WaterQualityStandard as StandardSchema, WaterQualityStandardCreate
)

router = APIRouter()

# --- Parameter ---
@router.post("/parameters/", response_model=ParameterSchema)
def create_parameter(parameter: ParameterCreate, db: Session = Depends(get_db)):
    db_param = Parameter(**parameter.model_dump())
    db.add(db_param)
    db.commit()
    db.refresh(db_param)
    return db_param

@router.get("/parameters/", response_model=List[ParameterSchema])
def read_parameters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Parameter).offset(skip).limit(limit).all()

# --- Water Quality Standard ---
@router.post("/standards/", response_model=StandardSchema)
def create_standard(standard: WaterQualityStandardCreate, db: Session = Depends(get_db)):
    db_std = WaterQualityStandard(**standard.model_dump())
    db.add(db_std)
    db.commit()
    db.refresh(db_std)
    return db_std

@router.get("/standards/", response_model=List[StandardSchema])
def read_standards(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(WaterQualityStandard).offset(skip).limit(limit).all()
