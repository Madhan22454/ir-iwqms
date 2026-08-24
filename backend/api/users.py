from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from api.deps import get_db, CurrentUser
from models.user import User
from schemas.user import UserCreate, UserResponse, UserUpdate
from core.security import get_password_hash

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None,
):
    """List all users — requires authentication."""
    return db.query(User).offset(skip).limit(limit).all()

@router.post("/", response_model=UserResponse)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None,
):
    """Create a new user — requires authentication."""
    # Check for duplicate employee_id or email
    existing = db.query(User).filter(
        (User.employee_id == user_in.employee_id) | (User.email == user_in.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID or email already registered")

    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        employee_id=user_in.employee_id,
        name=user_in.name,
        email=user_in.email,
        mobile_number=user_in.mobile_number,
        hashed_password=hashed_password,
        role=user_in.role,
        zone_id=user_in.zone_id,
        division_id=user_in.division_id,
        station_id=user_in.station_id,
        is_active=user_in.is_active if user_in.is_active is not None else True,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None,
):
    """Get a user by ID — requires authentication."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None,
):
    """Update a user — requires authentication."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    elif "password" in update_data:
        update_data.pop("password")
        
    for field, value in update_data.items():
        setattr(user, field, value)
        
    db.commit()
    db.refresh(user)
    return user
