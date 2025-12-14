"""Seed database with a default superadmin and optional admin users.

This script is meant for development use only. It will create a `superadmin` user
if it doesn't already exist, and optionally create admin users listed in
`settings.ADMIN_EMAILS`.

Usage:
  python scripts/seed_db.py --email superadmin@assist-ten.com --full-name "Super Admin" --create-admins

By default it reads `SUPERADMIN_EMAIL` and `SUPERADMIN_NAME` from env vars and will
create admin users listed in `settings.ADMIN_EMAILS` when `--create-admins` is passed.
"""
import asyncio
import os
import sys
from pathlib import Path
import argparse

# Ensure project root is on path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config import get_settings
from app.db.session import async_session_maker
from app.db.models import User
from sqlalchemy import select

settings = get_settings()


async def _create_user_if_not_exists(session, email: str, full_name: str | None, role: str = "admin"):
    result = await session.execute(select(User).where(User.email == email))
    existing = result.scalar_one_or_none()
    if existing:
        print(f"User {email} already exists (role={existing.role})")
        return existing

    user = User(
        email=email,
        full_name=full_name or email.split("@")[0].title(),
        is_active=True,
        is_verified=True,
        role=role,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    print(f"Created user {email} (role={role}, id={user.id})")
    return user


async def main():
    parser = argparse.ArgumentParser(description="Seed DB with superadmin and admin users")
    parser.add_argument("--email", type=str, help="Superadmin email or use SUPERADMIN_EMAIL env var")
    parser.add_argument("--full-name", type=str, help="Superadmin full name or use SUPERADMIN_NAME env var")
    parser.add_argument("--create-admins", action="store_true", help="Create admin users from settings.ADMIN_EMAILS")

    args = parser.parse_args()

    email = args.email or os.environ.get("SUPERADMIN_EMAIL") or "superadmin@assist-ten.com"
    full_name = args.full_name or os.environ.get("SUPERADMIN_NAME") or "Super Admin"
    create_admins = args.create_admins or False

    print("Connecting to DB to seed data...")

    async with async_session_maker() as session:
        await _create_user_if_not_exists(session, email, full_name, role="superadmin")

        if create_admins:
            print("Creating admin users from settings.ADMIN_EMAILS...")
            for admin_email in settings.ADMIN_EMAILS:
                if not admin_email:
                    continue
                await _create_user_if_not_exists(session, admin_email, None, role="admin")

    print("Seeding complete.")


if __name__ == "__main__":
    asyncio.run(main())
