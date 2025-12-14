"""Bootstrap script to create a superadmin and optionally seed admin users.

Usage:
  python scripts/create_superadmin.py --email admin@assist-ten.com --full-name "Admin User"  

Environment:
  - SUPERADMIN_EMAIL: email for superadmin (optional, can be provided as --email)
  - SUPERADMIN_NAME: display name (optional, can be provided as --full-name)

Optional flags:
  --create-admins: Create admin accounts listed in settings.ADMIN_EMAILS (if they don't exist)
  --force: If a user exists but does not have the expected role, update the role without prompting.

The script uses Async SQLAlchemy session from app.db.session to safely insert or update `User`.
"""
import asyncio
import os
import sys
from pathlib import Path
from typing import Optional
import argparse

# Ensure project root is on path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config import get_settings
from app.db.session import async_session_maker
from app.db.models import User
from sqlalchemy import select


settings = get_settings()


async def _create_or_update_user(
    email: str, full_name: Optional[str], role: str = "admin", force: bool = False
):
    async with async_session_maker() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user is None:
            print(f"Creating user {email} with role={role}...")
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
            print(f"✅ Created user {email} (id={user.id}, role={user.role})")
            return user

        # user exists
        if user.role == role:
            print(f"ℹ️  User {email} already exists with role {role} (id={user.id})")
            return user

        # Update role if force is True, otherwise prompt
        if force:
            old_role = user.role
            user.role = role
            await session.commit()
            await session.refresh(user)
            print(f"⚠️  Updated user {email} role from {old_role} -> {role} (id={user.id})")
            return user

        # Ask interactively
        # (In non-interactive CI environments, recommend using --force)
        yn = input(
            f"User {email} exists with role '{user.role}'. Change role to '{role}'? [y/N]: "
        ).strip().lower()
        if yn in ("y", "yes"):
            old_role = user.role
            user.role = role
            await session.commit()
            await session.refresh(user)
            print(f"⚠️  Updated user {email} role from {old_role} -> {role} (id={user.id})")
            return user

        print(f"Skipping user {email} update.")
        return user


async def main():
    parser = argparse.ArgumentParser(description="Create a superadmin and optionally admins.")
    parser.add_argument("--email", type=str, help="Superadmin email. If not provided, uses SUPERADMIN_EMAIL env var.")
    parser.add_argument("--full-name", type=str, help="Superadmin full name. If not provided, uses SUPERADMIN_NAME env var or email prefix.")
    parser.add_argument(
        "--create-admins",
        action="store_true",
        help="Create default admin users from settings.ADMIN_EMAILS",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force changes to existing user roles without prompting",
    )

    args = parser.parse_args()

    email = args.email or os.environ.get("SUPERADMIN_EMAIL")
    full_name = args.full_name or os.environ.get("SUPERADMIN_NAME")
    create_admins = args.create_admins or False
    force = args.force or False

    if not email:
        # Prompt for email interactively if none provided
        email = input("Enter superadmin email: ").strip()
        if not email:
            print("Superadmin email required. Set SUPERADMIN_EMAIL or pass --email")
            sys.exit(1)

    # Validate local database connection
    print("🔌 Connecting to DB to create superadmin...")

    await _create_or_update_user(email=email, full_name=full_name, role="superadmin", force=force)

    if create_admins:
        print("👥 Creating admin users from settings.ADMIN_EMAILS...")
        for admin_email in settings.ADMIN_EMAILS:
            if not admin_email:
                continue
            await _create_or_update_user(email=admin_email, full_name=None, role="admin", force=force)

    print("✨ Done.")


if __name__ == "__main__":
    asyncio.run(main())
