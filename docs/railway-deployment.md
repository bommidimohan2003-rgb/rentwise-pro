# Railway Deployment & GitHub Linking Guide

This guide details how to link your GitHub repository to Railway to automatically build, run, and host the Payent Python FastAPI backend and MySQL database.

---

## 1. Prerequisites

1. A [Railway.app](https://railway.app) account linked to your GitHub account (`bommidimohan2003-rgb`).
2. GitHub Repository: `https://github.com/bommidimohan2003-rgb/rentwise-pro`.

---

## 2. Step-by-Step Setup on Railway

### Step 1: Create a New Railway Project

1. Log in to [Railway Dashboard](https://railway.app/dashboard).
2. Click **+ New Project**.
3. Select **Deploy from GitHub repo**.
4. Choose `bommidimohan2003-rgb/rentwise-pro`.

### Step 2: Configure Service Root Directory

Since this repository contains both frontend and backend code:

1. Click on the deployed service card in Railway.
2. Go to **Settings** -> **Source**.
3. Set **Root Directory** to `backend`.
4. Railway will automatically detect `Procfile`, `railway.json`, and `requirements.txt`.

### Step 3: Add a MySQL Database Service

1. In the same Railway Project canvas, click **+ New** -> **Database** -> **Add MySQL**.
2. Railway will deploy a production-ready MySQL database container and automatically generate connection variables (`MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`).

### Step 4: Link Environment Variables

1. Go back to your **Backend Service** -> **Variables**.
2. Click **+ New Variable** -> **Add Reference** to pull Railway's MySQL connection variables:
   - `MYSQLHOST` -> `${{MySQL.MYSQLHOST}}`
   - `MYSQLPORT` -> `${{MySQL.MYSQLPORT}}`
   - `MYSQLUSER` -> `${{MySQL.MYSQLUSER}}`
   - `MYSQLPASSWORD` -> `${{MySQL.MYSQLPASSWORD}}`
   - `MYSQLDATABASE` -> `${{MySQL.MYSQLDATABASE}}`
3. Add custom backend variables:
   - `JWT_SECRET_KEY` = `payent_production_jwt_secret_key_2026`
   - `ADMIN_SETUP_CODE` = `PAYENT-ADMIN-2026`

### Step 5: Generate Public Domain URL

1. Go to **Settings** -> **Networking** -> **Generate Domain**.
2. Railway will assign a public HTTPS URL (e.g. `https://payent-backend-production.up.railway.app`).
3. Verify by opening `https://<your-railway-url>/health` in your browser. You should see `{"status":"ok","service":"Payent Backend"}`.

---

## 3. Link Backend URL to Vercel Frontend

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) project settings.
2. Go to **Environment Variables**.
3. Add / Update `VITE_API_URL` = `https://<your-railway-url>`.
4. Trigger a redeploy on Vercel.

---

## 4. Automated CI/CD Workflow

Every time you push new code to `origin/main` on GitHub:

- **Vercel** automatically rebuilds the frontend.
- **Railway** automatically rebuilds and restarts the FastAPI backend using `uvicorn main:app --host 0.0.0.0 --port $PORT`.
