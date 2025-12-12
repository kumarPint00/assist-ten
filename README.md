# AI Learning Assessment Platform

A full-stack AI-powered learning platform with FastAPI backend and React frontend, containerized with Docker.

## 🏗️ Architecture

- **Backend (BE/)**: FastAPI with SQLAlchemy, PostgreSQL, Redis, Celery
- **Frontend (FE/)**: Next.js with TypeScript, Material-UI
- **Services**: PostgreSQL, Redis, MinIO (S3-compatible storage), Celery workers

## 🚀 Quick Start with Docker

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available
- Ports 3000, 8000, 5432, 6379, 9000, 9001, 5555 available

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd assist-ten
   ```

2. **Ensure sufficient disk space** (at least 10GB free for Docker images)
   ```bash
   df -h  # Check available space
   docker system prune -a  # Clean up old images if needed
   ```

3. **Create environment file** (optional, defaults are set for development)
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start all services**
   ```bash
   docker compose up --build
   ```

   Or run in background:
   ```bash
   docker compose up -d --build
   ```

4. **Run database migrations** (first time only)
   ```bash
   docker compose exec api alembic upgrade head
   ```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001 (admin/admin)
- **Celery Flower**: http://localhost:5555

### Development Workflow

- **View logs**: `docker compose logs -f [service]`
- **Stop services**: `docker compose down`
- **Rebuild after code changes**: `docker compose up --build`
- **Reset database**: `docker compose down -v` (removes volumes)

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=assist_ten_db
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_URL=redis://redis:6379/0

# Celery
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# MinIO/S3
S3_ENDPOINT_URL=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production

# AI/ML
GROQ_API_KEY=your-groq-api-key

# Email (optional)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Azure AD SSO (for production)
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id

# Environment
ENVIRONMENT=development
```

### Authentication Modes

- **Development**: OTP email authentication
- **Production**: Azure AD SSO (set `ENVIRONMENT=production`)

## 📁 Project Structure

```
assist-ten/
├── BE/                    # FastAPI backend
│   ├── app/              # Application code
│   ├── alembic/          # Database migrations
│   └── requirements.txt  # Python dependencies
├── FE/                    # Next.js frontend
│   ├── app/              # Next.js app router
│   ├── src/              # Source code
│   └── package.json      # Node dependencies
├── docker-compose.yml    # Docker orchestration
└── README.md            # This file
```

## 🛠️ Development Without Docker

### Backend Setup

```bash
cd BE
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Set up PostgreSQL, Redis, MinIO locally or use docker-compose for services
make dev
```

### Frontend Setup

```bash
cd FE
npm install
npm run dev
```

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 8000, 5432, 6379, 9000, 9001, 5555 are free
2. **Database connection**: Wait for PostgreSQL to be healthy before starting API
3. **Build failures**: Clear Docker cache with `docker system prune`
4. **Permission issues**: Ensure Docker has access to the project directory

### Logs and Debugging

```bash
# View all logs
docker compose logs

# View specific service logs
docker compose logs api
docker compose logs fe

# Follow logs in real-time
docker compose logs -f api
```

### Reset Everything

```bash
# Stop and remove containers, networks, volumes
docker compose down -v --remove-orphans

# Remove images
docker compose down --rmi all

# Clean Docker system
docker system prune -a
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [MinIO Documentation](https://docs.min.io/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure Docker setup works
5. Submit a pull request