import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi import HTTPException

from main import app
from api.deps import get_db, get_current_user
from database import Base
from models.hierarchy import Station, Division, Zone
from models.user import User

# Setup in-memory sqlite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_db():
    db = TestingSessionLocal()
    # Create required hierarchy
    zone = Zone(id=1, name="Zone 1", code="Z1")
    db.add(zone)
    div = Division(id=1, name="Div 1", code="D1", zone_id=1)
    db.add(div)
    station = Station(id=1, name="Station 1", code="S1", division_id=1)
    db.add(station)
    db.commit()
    yield db
    db.close()

def mock_auth_user(role="CENTRAL_ADMIN", station_id=1):
    def _mock():
        return User(id=1, role=role, is_active=True, station_id=station_id, division_id=1, zone_id=1)
    return _mock

def test_create_water_source_unauthenticated(test_db):
    # No dependency override for get_current_user, so it will fail auth
    app.dependency_overrides.pop(get_current_user, None)
    response = client.post(
        "/api/v1/hierarchy/water-sources/",
        json={
            "source_id_code": "TEST-BW-UNAUTH",
            "station_id": 1
        }
    )
    assert response.status_code == 401

def test_create_water_source_valid_authorized(test_db):
    app.dependency_overrides[get_current_user] = mock_auth_user(role="CENTRAL_ADMIN")
    response = client.post(
        "/api/v1/hierarchy/water-sources/",
        json={
            "source_id_code": "TEST-BW-01",
            "station_id": 1,
            "source_type": "Borewell",
            "capacity": "1000L",
            "areas_supplied": "Platform 1",
            "population_served": 500,
            "disinfection_frequency_days": 15
        }
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["source_id_code"] == "TEST-BW-01"

def test_create_water_source_unauthorized_role(test_db):
    # LABORATORY role is not authorized to create water sources
    app.dependency_overrides[get_current_user] = mock_auth_user(role="LABORATORY")
    response = client.post(
        "/api/v1/hierarchy/water-sources/",
        json={
            "source_id_code": "TEST-BW-02",
            "station_id": 1
        }
    )
    assert response.status_code == 403
    assert "Role not authorized" in response.text

def test_create_water_source_unauthorized_scope(test_db):
    # STATION_INCHARGE of a different station (e.g. ID 2) trying to create for Station 1
    app.dependency_overrides[get_current_user] = mock_auth_user(role="STATION_INCHARGE", station_id=2)
    response = client.post(
        "/api/v1/hierarchy/water-sources/",
        json={
            "source_id_code": "TEST-BW-03",
            "station_id": 1
        }
    )
    assert response.status_code == 403
    assert "Not authorized to create water sources for this station" in response.text

def test_create_water_source_duplicate(test_db):
    app.dependency_overrides[get_current_user] = mock_auth_user(role="CENTRAL_ADMIN")
    client.post(
        "/api/v1/hierarchy/water-sources/",
        json={"source_id_code": "TEST-BW-DUP", "station_id": 1}
    )
    # Second create with same ID code
    response = client.post(
        "/api/v1/hierarchy/water-sources/",
        json={"source_id_code": "TEST-BW-DUP", "station_id": 1}
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]

def test_transaction_rollback_after_integrity_error(test_db):
    app.dependency_overrides[get_current_user] = mock_auth_user(role="CENTRAL_ADMIN")
    client.post(
        "/api/v1/hierarchy/water-sources/",
        json={"source_id_code": "TEST-BW-DUP2", "station_id": 1}
    )
    resp1 = client.post(
        "/api/v1/hierarchy/water-sources/",
        json={"source_id_code": "TEST-BW-DUP2", "station_id": 1}
    )
    assert resp1.status_code == 409
    
    resp2 = client.post(
        "/api/v1/hierarchy/water-sources/",
        json={"source_id_code": "TEST-BW-NEW", "station_id": 1}
    )
    assert resp2.status_code == 200, resp2.text
