# Makefile for Assist-Ten Backend

.PHONY: help install dev prod test clean docker-up docker-down migrate shell

help:
	@echo "Assist-Ten - Backend Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Run development server"
	@echo "  make celery       - Run Celery worker"
	@echo "  make flower       - Run Flower (Celery monitoring)"
	@echo ""
	@echo "Database:"
	@echo "  make migrate      - Run database migrations"
	@echo "  make migration    - Create new migration"
	@echo "  make rollback     - Rollback last migration"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up    - Start all services with docker-compose"
	@echo "  make docker-down  - Stop all services"
	@echo "  make docker-logs  - View logs"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run tests"
	@echo "  make test-cov     - Run tests with coverage"
	@echo "  make lint         - Run linters"
	@echo ""
	@echo "Other:"
	@echo "  make clean        - Clean up cache files"
	@echo "  make shell        - Open Python shell with app context"

install:
	pip install -r requirements.txt

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

celery:
	celery -A app.core.celery_app worker --loglevel=info --queues=default,questions,scores,emails

celery-beat:
	celery -A app.core.celery_app beat --loglevel=info

flower:
	celery -A app.core.celery_app flower --port=5555

migrate:
	alembic upgrade head

migration:
	@read -p "Enter migration message: " msg; \
	alembic revision --autogenerate -m "$$msg"

rollback:
	alembic downgrade -1

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-rebuild:
	docker-compose up -d --build

create-superadmin:
	python scripts/create_superadmin.py --create-admins

seed-db:
	python scripts/seed_db.py --create-admins

test:
	@$(MAKE) check-deps
	pytest

check-deps:
	@echo "Checking that minimal Python dependencies are installed..."
	@python3 - <<'PY'
import sys
missing = []
for pkg in ('fastapi','sqlalchemy','alembic'):
	try:
		__import__(pkg)
	except Exception as e:
		missing.append(pkg)
if missing:
	print('Missing required packages:', ', '.join(missing))
	print('Install them with: pip install -r requirements-minimal.txt')
	sys.exit(1)
print('Dependencies OK')
PY

test-cov:
	pytest --cov=app --cov-report=html --cov-report=term

lint:
	ruff check .
	black --check .

format:
	black .
	ruff check --fix .

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf .coverage

shell:
	python -i -c "from app.main import app; from app.db.session import async_session_maker; print('FastAPI app loaded. Use app and async_session_maker')"
