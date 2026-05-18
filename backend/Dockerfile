# EternoMind backend — Dev image
# FastAPI + LangGraph pipeline + SQLite + JWT auth.
# For production, drop --reload and add a non-root user.

FROM python:3.11-slim

WORKDIR /app

# System deps for compiling some Python packages (bcrypt, chromadb)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first for better layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the application
COPY . .

# Create the data directory for SQLite + persisted files
RUN mkdir -p /app/data

EXPOSE 8000

# Default command — overridden by docker-compose to run migrations + seed user first
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
