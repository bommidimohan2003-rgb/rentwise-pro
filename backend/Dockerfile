# Production Dockerfile for Payent FastAPI Backend
FROM python:3.11-slim

# Prevent Python from writing .pyc files & enable unbuffered stdout logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

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

# Run database schema initialization and start Uvicorn server
CMD ["sh", "-c", "python -c 'from database import init_db; init_db()' && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
