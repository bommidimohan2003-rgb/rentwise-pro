# Production Dockerfile for Payent FastAPI Backend
FROM python:3.11-slim

# Prevent Python from writing .pyc files & enable unbuffered stdout logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

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

# Copy source code into /app
COPY . .

# Normalize directory structure: if built with root context, sync backend/ contents to /app root
RUN if [ -d "/app/backend" ] && [ -f "/app/backend/main.py" ]; then cp -rn /app/backend/* /app/; fi

# Expose server port
EXPOSE 8000

# Start Uvicorn server (main:app will always resolve in /app)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]
