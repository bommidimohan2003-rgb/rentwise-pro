# PAYENT — Production Deployment, Reliability, Observability & Disaster Recovery Runbook

This document defines the production operations architecture, disaster recovery procedures, observability standards, and deployment runbooks for the **PAYENT** peer-to-peer tech gear rental platform.

---

## 1. Production Architecture Overview

```
                            [ DNS / CDN / Edge: Vercel ]
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   │                                           │
          Static Assets & HTML                        /api/:path* Rewrite
                   │                                           │
         [ Client Browser / SPA ]                     [ Railway PaaS Engine ]
                   │                                     (FastAPI ASGI)
                   │                                           │
                   └─────────── WSS / REST ────────────────────┤
                                                               │
                                                 ┌─────────────┴─────────────┐
                                                 │                           │
                                        [ TiDB Cloud MySQL ]        [ External Webhooks ]
                                         (SSL Connection Pool)       (Razorpay / Twilio)
```

### Infrastructure Components

| Layer | Platform | Configuration / Specs | Health Probe |
|---|---|---|---|
| **Frontend SPA** | **Vercel** | React 19, Vite 8, TanStack Router, Tailwind CSS v4 | `/*` -> `index.html` (SPA rewrites) |
| **API Backend** | **Railway** | FastAPI, Python 3.11-slim, Uvicorn ASGI, Dockerfile | `/api/health/live` (Timeout: 300s) |
| **Database** | **TiDB Cloud** | MySQL 8.0-compatible Serverless / Dedicated Cluster | `/api/health/ready` (`SELECT 1`) |
| **Payment Gateway**| **Razorpay** | HMAC-SHA256 Signed Webhooks + Idempotency Ledger | `/api/payments/webhook` |
| **Realtime Sync** | **WebSockets** | ASGI WebSocket channels for Admin, Chat, GPS | `/api/conversations/{id}/ws` |

---

## 2. Environment Variable Audit & Matrix

| Variable | Scope | Status | Purpose / Security Guardrail |
|---|---|:---:|---|
| `DATABASE_URL` | Backend | **CONFIGURED** | TiDB Cloud MySQL SSL connection URI. |
| `JWT_SECRET_KEY` | Backend | **CONFIGURED** | Cryptographic key for HS256 JWT access tokens. Fails fast in prod if unset. |
| `JWT_ALGORITHM` | Backend | **CONFIGURED** | Pinned to `HS256` (enforced at startup). |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Backend | **CONFIGURED** | 30 minutes access token lifetime. |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Backend | **CONFIGURED** | 7 days refresh token lifetime. |
| `ADMIN_SETUP_CODE` | Backend | **CONFIGURED** | Required code to register or upgrade admin accounts. |
| `ADMIN_CREATION_SECRET` | Backend | **CONFIGURED** | Secret key for admin creation endpoint. |
| `RAZORPAY_KEY_ID` | Backend / Client | **CONFIGURED** | Public Razorpay API key for checkout modal. |
| `RAZORPAY_KEY_SECRET` | Backend | **CONFIGURED** | Private secret for Razorpay orders & refunds. |
| `RAZORPAY_WEBHOOK_SECRET` | Backend | **CONFIGURED** | Mandatory secret for HMAC-SHA256 webhook validation. |
| `ALLOWED_ORIGINS` | Backend | **CONFIGURED** | Comma-separated list of allowed CORS domains. |
| `ENV` / `ENVIRONMENT` | Backend | **CONFIGURED** | `production` / `development` flag. |
| `VITE_API_URL` | Frontend | **CONFIGURED** | Build-time API base URL (defaults to origin rewrite). |
| `ENABLE_TWILIO_SMS` | Backend | **CONFIGURED** | Optional Twilio flag (defaults to secure internal OTP). |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Backend | **OPTIONAL** | Optional Google SSO verification credentials. |

---

## 3. Health Checks & Probing Architecture

PAYENT distinguishes between **Liveness** (process health) and **Readiness** (dependency health):

### 1. Liveness Probe (`GET /api/health/live`)
- **Target Audience**: Platform orchestrators (Kubernetes / Railway process monitor).
- **Behavior**: Returns `200 OK` if the FastAPI event loop is running.
- **Payload**:
  ```json
  {
    "status": "alive",
    "service": "Payent FastAPI Backend API",
    "timestamp": "2026-09-17T04:45:00.000Z"
  }
  ```

### 2. Readiness Probe (`GET /api/health/ready`)
- **Target Audience**: Load balancers, deployment gates, and traffic routers.
- **Behavior**: Executes `SELECT 1 AS is_alive` via connection pool.
  - **Healthy (200 OK)**: `{"status": "ready", "database": "connected", ...}`
  - **Degraded (503 Service Unavailable)**: `{"status": "unhealthy", "database": "disconnected", ...}`
- **Security**: Never exposes internal database hostnames, query syntax, or credentials.

### 3. Universal Orchestrator Probe (`GET /api/health`, `GET /health`)
- **Target Audience**: Default Docker / Railway healthcheck probes.
- **Behavior**: Returns `{"status": "ok", "service": "Payent FastAPI Backend API", ...}`.

---

## 4. Structured Observability & Logging Standards

Every incoming HTTP request is correlated and structured via middleware:

1. **Correlation Identifier (`X-Request-ID`)**:
   - Accepts incoming `x-request-id` header from upstream edge/reverse-proxies.
   - Automatically generates a 12-character hex ID (`req_xxxxxxxxxxxx`) if none is provided.
   - Injects `X-Request-ID` into the response headers.
2. **Access Log Format**:
   ```
   [req_ef5740d6f8df] POST /api/payments/webhook -> 200 (2864.21ms)
   ```
3. **Redaction Policy (Zero-Log Privacy)**:
   - Passwords, OTP codes, and Aadhaar numbers are never logged.
   - JWT tokens and Authorization headers are masked.
   - Razorpay webhook payload signatures and private chat text are omitted from debug logs.

---

## 5. Database Disaster Recovery & Automated Backup

### TiDB Cloud Production Backup
- **Automated Snapshots**: Daily automated physical backups managed by TiDB Cloud with 7-day retention.
- **Point-in-Time Recovery (PITR)**: Continuous transaction log archiving allowing restoration to any second within the retention window.

### Logical Disaster Recovery Tool (`backend/scripts/db_backup.py`)
- Standalone logical backup script for disaster recovery and offline archives:
  ```bash
  # Execute full logical backup with SHA256 validation
  python scripts/db_backup.py

  # Test connectivity and count records in dry-run mode
  python scripts/db_backup.py --dry-run
  ```
- **Backup Manifest Structure**:
  - Validates 14 core tables (`users`, `custom_products`, `orders`, `reviews`, `conversations`, `messages`, `deliveries`, `support_tickets`, `admin_logs`, etc.).
  - Computes SHA256 checksum on export payload.
  - Serializes `Decimal` and `datetime` types without precision loss.

---

## 6. Failure Recovery Runbook

| Failure Scenario | Automatic Recovery Behavior | Manual Intervention Steps |
|---|---|---|
| **Database Disconnect / Timeout** | Connection pool automatically retries on subsequent requests; readiness probe transitions to 503; in-memory cache shields public read endpoints. | Check TiDB Cloud cluster status; verify Railway egress network. |
| **Razorpay Webhook Timeout / Retry** | Deduplication ledger (`processed_payment_events`) identifies replayed event IDs; returns HTTP 200 OK without double-charging or corrupting order status. | Inspect Razorpay Dashboard Webhook Logs; verify signature configuration. |
| **WebSocket Client Disconnect** | TanStack Query + WebSocket listener auto-reconnects with exponential backoff (1s, 2s, 4s, 8s, max 30s); initial sync reads from DB. | Verify client network connectivity; database remains absolute source of truth. |
| **GPS Telemetry Failure** | Delivery tracking frontend displays latest recorded breadcrumb; state machine transitions remain operational. | Lender updates milestone manually via lender portal. |
| **External Service Outage (Firebase/Maps)** | Authentication falls back to local JWT; OpenStreetMap tiles load from CartoCDN fallback mirrors; core rental booking proceeds unaffected. | Monitor third-party status pages. |

---

## 7. Zero-Downtime Deployment & Rollback Strategy

### Safe Deployment Sequence
1. **Step 1: Database Migration (Backward-Compatible)**:
   - Add new nullable columns or tables using `init_db()` idempotent helpers (`IF NOT EXISTS`).
   - Never drop or rename active columns in the same release.
2. **Step 2: Backend API Deployment (Railway)**:
   - Build new Docker image via Railway.
   - Railway spins up new replica and monitors `/api/health/live`.
   - Once healthy, Railway shifts ingress traffic and drains old replica.
3. **Step 3: Frontend Deployment (Vercel)**:
   - Deploy static assets to Vercel global edge.
   - Instant atomic cutover with zero downtime.

### Rollback Runbook
- **Frontend Rollback**: In Vercel dashboard, click **Promote to Production** on the previous successful deployment (<10 seconds).
- **Backend Rollback**: In Railway dashboard, select **Deployments** ➔ **Rollback** on the previous healthy container image (<30 seconds).
- **Database Rollback**: Apply reverse SQL migration script or restore from logical snapshot `payent_backup_<timestamp>.json`.

---

## 8. Recommended Alerting Thresholds

| Metric | Threshold | Evaluation Window | Recommended Action |
|---|---|---|---|
| **HTTP 5xx Error Rate** | > 1.0% of total requests | 5 minutes | Inspect Railway backend logs for `[ERROR]` traces. |
| **Readiness Healthcheck Failure** | `/api/health/ready` returns 503 | 2 consecutive checks | Check TiDB Cloud connection pool and latency. |
| **Webhook Signature Failures** | > 3 failures in 10 minutes | 10 minutes | Check Razorpay webhook secret synchronization. |
| **API P95 Latency** | > 1500 ms on non-search endpoints | 5 minutes | Investigate database query latency or slow external calls. |
| **Brute-Force Rate Limits Triggered** | > 20 events in 10 minutes | 10 minutes | Check IP origins for automated credential-stuffing attack. |
