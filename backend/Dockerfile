# Backend (FastAPI + SQLAlchemy)
# Multi-stage build: dependencies + runtime

FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies (if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements to leverage Docker layer caching
COPY requirements.txt .

# Create virtual env and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -r requirements.txt


FROM python:3.12-slim AS runtime

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Set environment variables
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Copy application code
COPY alembic/ ./alembic/
COPY alembic.ini .
COPY app/ ./app/

# Create directory for SQLite database (will be mounted as volume)
RUN mkdir -p /app/data

# Run migrations and start the application
CMD ["sh", "-c", "alembic upgrade head && python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
