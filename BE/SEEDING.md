# Seeding Development Data

This file describes how to seed development data for the backend so Admin / Superadmin UI pages have realistic sample data.

Prerequisites
- Run migrations so tables exist:

```bash
cd BE
../venv/bin/alembic upgrade heads
```

Also ensure your Python dependencies are installed in the repo venv (or your active virtualenv):

```bash
cd BE
../venv/bin/pip install -r requirements.txt
```

Seed data
- The `scripts/seed_db.py` script supports optional flags to create richer sample data used by the Superadmin UI:

```bash
../venv/bin/python3 scripts/seed_db.py --email superadmin@assist10.com --full-name "Super Admin" --create-admins --with-tenants --with-flags --with-metrics --with-incidents --with-candidates --with-interviews --with-assessments --with-proctoring
```

- The script will create (idempotently):
  - a `superadmin` user and optional admin users from `settings.ADMIN_EMAILS`
  - sample tenants
  - sample feature flags
  - sample system metrics
  - sample system incidents
  - sample candidates and interview sessions

Troubleshooting
- If the script errors with "relation ... does not exist", run migrations (see above).
- If migrations result in multiple heads, run `alembic upgrade heads` to apply all migrations.

If you'd like, I can add a one-click Makefile target or docker-compose task to run seeding for local dev environments.

Note: If seeding proctoring events fails with an import error or "ProctoringEvent not defined", ensure you have applied the latest migrations and that `ProctoringEvent` exists in `app.db.models` (this repository recently added proctoring model support).
