# Production Dockerfile for Payent FastAPI Backend
FROM python:3.11-slim

# Prevent Python from writing .pyc files & enable unbuffered stdout logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app:/app/backend

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose server port
EXPOSE 8000

# Start Uvicorn server: handles both root build context (backend.main:app) and backend build context (main:app)
CMD ["sh", "-c", "if [ -f backend/main.py ]; then uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}; else uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}; fi"]
