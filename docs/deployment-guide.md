# Payent Platform Deployment Guide

This guide details the process for deploying the **Payent** tech gear rental platform using the recommended architecture:

```
Vercel (React/Vite Frontend) ➔ Railway (FastAPI Backend) ➔ TiDB Cloud (MySQL Database) ➔ Payment Gateway (Verified Webhooks)
```

---

## Architecture Overview

1. **Database**: **TiDB Cloud** (Serverless/Dedicated MySQL)
   - Fully managed MySQL-compatible cloud database.
   - Requires SSL/TLS connection (`MYSQL_SSL=true`).
2. **Backend**: **Railway** (FastAPI ASGI Web Service)
   - Deployed via Dockerfile (`backend/Dockerfile`).
   - Handles API routes, JWT authentication, raw PyMySQL connection pooling, and Razorpay HMAC-SHA256 webhooks.
   - Healthcheck endpoint: `/api/health`.
3. **Frontend**: **Vercel** (React 19 / Vite SPA)
   - Static web application built with `npm run build`.
   - Single-Page Application (SPA) rewrite configuration maps `/*` to `index.html`.
4. **Payment Gateway**: **Razorpay** (Live/Test Webhook Engine)
   - Configured with signature verification (`X-Razorpay-Signature`) against `RAZORPAY_WEBHOOK_SECRET`.

---

## Step 1: Set Up TiDB Cloud Database

1. Sign in to [TiDB Cloud](https://tidbcloud.com/).
2. Create a Serverless cluster (e.g., `payent-db`).
3. Under **Connect** -> **Standard Connection**:
   - Note down the **Host** (e.g. `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`), **Port** (`4000`), **User**, and **Password**.
4. Create a database named `payent_db` or allow backend automatic schema initialization on first connection.

---

## Step 2: Deploy Backend to Railway

1. Sign in to [Railway.app](https://railway.app/).
2. Click **New Project** ➔ **Deploy from GitHub repo**.
3. Select your `rentwise-pro` repository.
4. Railway will detect `railway.json` and use `backend/Dockerfile`.
5. Under **Variables** in your Railway service settings, add the following production environment variables:

| Variable Name | Example Value / Description |
|---|---|
| `ENV` | `production` |
| `IS_PRODUCTION` | `true` |
| `JWT_SECRET_KEY` | Generate via `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ADMIN_SETUP_CODE` | Your secure admin registration key (e.g. `PAYENT-ADMIN-2026`) |
| `MYSQL_HOST` | `gateway01.ap-southeast-1.prod.aws.tidbcloud.com` |
| `MYSQL_PORT` | `4000` |
| `MYSQL_USER` | `<tidb-user-root>` |
| `MYSQL_PASSWORD` | `<tidb-password>` |
| `MYSQL_DB` | `payent_db` |
| `MYSQL_SSL` | `true` |
| `ALLOWED_ORIGINS` | `https://<your-app>.vercel.app,https://payent.in` |
| `RAZORPAY_KEY_ID` | `rzp_live_xxxxxxxxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | `<your-razorpay-key-secret>` |
| `RAZORPAY_WEBHOOK_SECRET` | `<your-razorpay-webhook-secret>` |

6. Generate a Domain under **Settings** ➔ **Networking** (e.g. `https://payent-backend.up.railway.app`).
7. Verify deployment health at `https://payent-backend.up.railway.app/api/health`.

---

## Step 3: Deploy Frontend to Vercel

1. Sign in to [Vercel](https://vercel.com/).
2. Click **Add New...** ➔ **Project**.
3. Import your `rentwise-pro` GitHub repository.
4. Framework Preset: **Vite** (Vercel will detect `vercel.json`).
5. Under **Environment Variables**, configure:

| Variable Name | Value |
|---|---|
| `VITE_API_URL` | `https://payent-backend.up.railway.app` |

6. Click **Deploy**. Vercel will execute `npm run build` and publish your site (e.g. `https://payent.vercel.app`).

---

## Step 4: Configure Razorpay Verified Webhooks

1. Log into your [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Settings** ➔ **Webhooks** ➔ **Add New Webhook**.
3. **Webhook URL**: `https://payent-backend.up.railway.app/api/payments/webhook`
4. **Secret**: Enter the exact secret string you set in Railway under `RAZORPAY_WEBHOOK_SECRET`.
5. **Active Events**: Select:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
   - `refund.processed`
6. Click **Save Webhook**.

---

## Verification & Post-Deployment Checklist

- [ ] **Backend Health Probe**: `GET https://payent-backend.up.railway.app/api/health` returns `200 OK` with JSON status.
- [ ] **Database Connectivity**: Tables (`users`, `products`, `orders`, `payments`, `admin_logs`) automatically initialized in TiDB Cloud.
- [ ] **Frontend Routing**: Direct navigation to `/admin`, `/catalog`, and `/dashboard` loads seamlessly on Vercel without 404 errors.
- [ ] **Webhook Verification**: Test webhook events in Razorpay dashboard verify signature (`X-Razorpay-Signature`) and update order status cleanly.
