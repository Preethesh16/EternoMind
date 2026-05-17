#!/usr/bin/env python3
"""
Seed a demo user for the EternoMind hackathon demo.

Usage:
    cd backend
    python scripts/seed_demo_user.py

Prints the demo credentials to stdout so Person 3 can use them in the UI.
"""
from __future__ import annotations

import os
import secrets
import sys

# Allow running from the backend/ directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import Base, SessionLocal, engine
from app.db.models import User
from app.security.auth import hash_password

DEMO_USERNAME = "demo"
DEMO_PASSWORD_ENV = os.getenv("DEMO_PASSWORD", "")


def main() -> None:
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # Use provided password or generate a secure one
    password = DEMO_PASSWORD_ENV or secrets.token_urlsafe(12)

    db = SessionLocal()
    try:
        existing: User | None = db.query(User).filter(User.username == DEMO_USERNAME).first()
        if existing:
            # Update the password so the seed is idempotent
            existing.hashed_password = hash_password(password)
            db.commit()
            print(f"Demo user updated.")
        else:
            user = User(
                username=DEMO_USERNAME,
                hashed_password=hash_password(password),
            )
            db.add(user)
            db.commit()
            print("Demo user created.")

        print("─" * 40)
        print(f"  Username : {DEMO_USERNAME}")
        print(f"  Password : {password}")
        print("─" * 40)
        print("Share these credentials with Person 3 for the demo login.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
