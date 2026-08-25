# Render Deployment Guide for Payent Platform

This guide explains how to deploy the **Payent** peer-to-peer tech gear rental platform (React/Vite frontend + FastAPI/Python backend + MySQL datastore) to [Render.com](https://render.com).

---

## Deployment Architecture

Render hosts the full application stack using two connected services:

1. **Backend Web Service (`payent-backend`)**:
   - **Runtime**: Python 3.11
   - **Start Command**: `gunicorn backend.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --workers 2`
   - **Health Check Probe**: `/api/health`
2. **Frontend Static Site (`payent-frontend`)**:
   - **Runtime**: Static Site (Node 20 build environment)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **SPA Routing**: Rewrites `/*` to `/index.html`

---

## Method 1: Automatic Blueprint Deployment (Recommended)

1. Push this repository to your GitHub or GitLab account.
2. Log into [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**.
4. Connect your repository. Render will automatically read `render.yaml`.
5. Fill in required environment variables (e.g. `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`).
6. Click **Apply**. Render will automatically build and launch both backend and frontend services.

---

## Method 2: Manual Web Dashboard Deployment

### 1. Deploy the Backend Web Service

1. On Render Dashboard, click **New +** -> **Web Service**.
2. Connect your repo and configure:
   - **Name**: `payent-backend`
   - **Language**: `Python 3`
   - **Region**: Select your preferred region (e.g., Singapore, Oregon)
   - **Branch**: `main`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn backend.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --workers 2`
3. Under **Advanced** -> **Health Check Path**: enter `/api/health`.
4. Add Environment Variables:
   - `PYTHON_VERSION`: `3.11.9`
   - `IS_PRODUCTION`: `true`
   - `JWT_SECRET_KEY`: `<secure-random-secret-key>`
   - `MYSQL_HOST`: `<your-mysql-host>`
   - `MYSQL_PORT`: `3306`
   - `MYSQL_USER`: `<your-mysql-user>`
   - `MYSQL_PASSWORD`: `<your-mysql-password>`
   - `MYSQL_DATABASE`: `payent_db`
   - `CORS_ORIGINS`: `https://payent-frontend.onrender.com`
5. Click **Create Web Service**. Note your backend URL (e.g. `https://payent-backend.onrender.com`).

### 2. Deploy the Frontend Static Site

1. On Render Dashboard, click **New +** -> **Static Site**.
2. Connect your repo and configure:
   - **Name**: `payent-frontend`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. Add Environment Variable:
   - `VITE_API_URL`: `https://payent-backend.onrender.com` (use your deployed backend URL)
4. Under **Redirects / Rewrites**:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`
5. Click **Create Static Site**.

---

## Post-Deployment Verification

1. **Backend Health Check**:
   Visit `https://<your-backend-url>/api/health`. You should receive:
   ```json
   {
     "status": "ok",
     "service": "Payent FastAPI Backend API",
     "timestamp": "2026-08-25T18:47:00.000Z"
   }
   ```
2. **Frontend Functionality**:
   Visit `https://<your-frontend-url>`. Verify product catalog loading, user login, admin panel routes, and interactive components.
