from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AccessTokenResponse(BaseModel):
    """Returned by /auth/refresh — no refresh token."""
    model_config = ConfigDict(from_attributes=True)

    access_token: str
    token_type: str = "bearer"


class LogoutResponse(BaseModel):
    message: str = "Logged out"
