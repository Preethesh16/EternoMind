"""
Tests for the /api/v1/auth endpoints.

Run from the backend/ directory:
    python -m pytest tests/test_auth.py -v
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base, get_db
from app.db.models import User
from app.main import app
from app.security.auth import hash_password

# ── In-memory SQLite for tests — StaticPool ensures all sessions
# ── share the same connection (required for :memory: databases)
TEST_DB_URL = "sqlite:///:memory:"

_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestSession = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


def override_get_db():
    db = _TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    """Create fresh tables before each test, drop after."""
    Base.metadata.create_all(bind=_engine)
    # Seed a test user
    db = _TestSession()
    db.add(User(username="testuser", hashed_password=hash_password("testpass123")))
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=_engine)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


# ── Login tests ───────────────────────────────────────────────────────────────

def test_login_success(client: TestClient) -> None:
    resp = client.post("/api/v1/auth/login", json={"username": "testuser", "password": "testpass123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client: TestClient) -> None:
    resp = client.post("/api/v1/auth/login", json={"username": "testuser", "password": "wrongpass"})
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid credentials"


def test_login_unknown_user(client: TestClient) -> None:
    resp = client.post("/api/v1/auth/login", json={"username": "nobody", "password": "anything"})
    assert resp.status_code == 401


# ── Refresh tests ─────────────────────────────────────────────────────────────

def test_token_refresh(client: TestClient) -> None:
    # Get tokens
    login_resp = client.post(
        "/api/v1/auth/login", json={"username": "testuser", "password": "testpass123"}
    )
    refresh_token = login_resp.json()["refresh_token"]

    # Use refresh token to get new access token
    resp = client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {refresh_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_refresh_with_access_token_fails(client: TestClient) -> None:
    """Access tokens must not be accepted on the refresh endpoint."""
    login_resp = client.post(
        "/api/v1/auth/login", json={"username": "testuser", "password": "testpass123"}
    )
    access_token = login_resp.json()["access_token"]

    resp = client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert resp.status_code == 401


# ── Logout tests ──────────────────────────────────────────────────────────────

def test_logout(client: TestClient) -> None:
    login_resp = client.post(
        "/api/v1/auth/login", json={"username": "testuser", "password": "testpass123"}
    )
    access_token = login_resp.json()["access_token"]

    resp = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["message"] == "Logged out"


def test_logout_without_token(client: TestClient) -> None:
    resp = client.post("/api/v1/auth/logout")
    assert resp.status_code == 401
