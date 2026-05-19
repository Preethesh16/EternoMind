# EternoMind — Setup Guide

## Quick Start (With Docker)

The easiest way to run EternoMind on any machine is with Docker Compose.

### Prerequisites
- Docker & Docker Compose installed
- Groq API key (free at https://console.groq.com/keys)
- Hindsight API key (free at https://app.hindsight.so)

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/Preethesh16/EternoMind.git
cd EternoMind
```

2. **Create `.env` file**
```bash
cp .env.example .env
```

3. **Fill in required API keys in `.env`**
```bash
GROQ_API_KEY=your_key_here
HINDSIGHT_API_KEY=your_key_here
```

4. **Start all services**
```bash
docker compose up --build
```

This will automatically start:
- Redis (cache)
- ChromaDB (vector store)
- Backend (FastAPI on http://localhost:8000)
- Frontend (React on http://localhost:5173)

5. **Open in browser**
```
http://localhost:5173
```

---

## Local Development Setup (Without Docker)

If you prefer local development, follow these steps.

### Prerequisites
- Python 3.11+
- Node.js 18+
- Redis (running locally or via Docker)
- ChromaDB (running locally or via Docker)

### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Create .env file
cp ../.env.example ../.env

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start backend (development)
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev  # Opens http://localhost:5173
```

### External Services (Redis + ChromaDB)

```bash
# Terminal 1: Redis
docker run -d -p 6379:6379 redis:7-alpine

# Terminal 2: ChromaDB
docker run -d -p 8001:8000 chromadb/chroma:latest
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | ✅ Yes | — | API key from Groq console |
| `HINDSIGHT_API_KEY` | ✅ Yes | — | API key from Hindsight dashboard |
| `REDIS_URL` | ✅ Yes | `redis://localhost:6379/0` | Redis connection URL |
| `CHROMA_HOST` | ✅ Yes | `localhost` | ChromaDB hostname |
| `CHROMA_PORT` | ✅ Yes | `8001` | ChromaDB port |
| `DATABASE_URL` | ✅ Yes | `sqlite:///./eternomind.db` | Database URL |
| `SECRET_KEY` | ⚠️ Recommended | (generated) | JWT secret key |
| `CORS_ORIGINS` | ✅ Yes | `http://localhost:5173` | Frontend URL for CORS |

---

## Verification

### Test Backend Health
```bash
curl http://localhost:8000/api/v1/health
```

Expected response:
```json
{"status": "healthy", "timestamp": "2026-05-19T..."}
```

### Test Full Pipeline
```bash
cd backend
source venv/bin/activate
python test_complete_system.py
```

---

## Troubleshooting

### Redis Connection Failed
```bash
# Check if Redis is running
redis-cli ping

# If not running, start it
docker run -d -p 6379:6379 redis:7-alpine
```

### ChromaDB Connection Failed
```bash
# Check if ChromaDB is running
curl http://localhost:8001/api/v1/heartbeat

# If not running, start it
docker run -d -p 8001:8000 chromadb/chroma:latest
```

### Missing API Keys
- Groq: https://console.groq.com/keys
- Hindsight: https://app.hindsight.so/settings
- cascadeflow: https://app.cascadeflow.ai (optional)

### Port Already in Use
```bash
# Change ports in docker-compose.yml or:
# Backend: Update port mapping
# Frontend: Update Vite config (vite.config.ts)
```

---

## Production Deployment

### Environment Variables for Production
```bash
export SECRET_KEY=$(openssl rand -hex 32)
export CORS_ORIGINS=https://yourdomain.com
export DATABASE_URL=postgresql://user:pass@prod-db:5432/eternomind
export REDIS_URL=redis://prod-redis:6379/0
```

### Deploy with Docker Compose
```bash
docker compose -f docker-compose.yml up -d
```

### Health Checks
All services include health checks. Monitor with:
```bash
docker compose ps
```

---

## Development Commands

```bash
# Backend tests
cd backend
python -m pytest tests/

# Frontend linting
cd frontend
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Architecture Overview

See the main [README.md](README.md) for the complete system architecture and the 12-step pipeline details.
