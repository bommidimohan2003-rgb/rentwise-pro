# Payent — Master Guidelines & Development Roadmap

This repository contains the source code for the Payent premium peer-to-peer tech gear rental platform.

- **Frontend**: React 19, TanStack Start/Router/Query, Tailwind CSS v4, Radix + shadcn-style primitives, Vite 8, TypeScript 5.
- **Backend**: FastAPI (uvicorn/gunicorn), PyMySQL with raw SQL (no ORM), JWT + bcrypt auth, Twilio + Razorpay integrations.
- **Datastore**: MySQL datastore.

---

## 1. Project Context

Payent is a peer-to-peer tech-gear rental marketplace. It is a working prototype mixing real backend routes, local persistence, mock storefront data, and experimental ML modules.

Key directory layout:

- `src/` — Customer frontend
- `src/admin/` — Separate admin app (own routes, own services, own storage keys)
- `backend/` — FastAPI service
- `docs/` — Documentation (includes `docs/project-report.md`, the source of truth for prompts and progress tracking)

Always inspect `docs/project-report.md` before planning tasks.

---

## 2. Mission Roadmap

Work through the technical-debt and integration backlog in priority order:

### Phase 1 — Dead code & duplicate removal (isolated PR)

- Remove `rentwise-pro-main/` (stale duplicate snapshot; confirm first it's not referenced anywhere outside `eslint.config.js`, then delete and drop the ignore entry).
- Remove `api/index.py` (orphaned serverless function wrapper, if present and unreferenced).
- Remove or explicitly archive `scratch/update_catalog.py` (orphaned maintenance script) — verify logic before deleting.
- Delete large commented-out legacy Razorpay block in `backend/main.py` (only after Phase 2 Razorpay work is confirmed working).
- Consolidate duplicate `requirements.txt` / hosting config artifacts into a single source of truth.

### Phase 2 — Security & config hardening

- Replace hardcoded `JWT_SECRET_KEY` and `MYSQL_PASSWORD` defaults in backend config with required env variables (fail fast at startup if unset in prod mode).
- Enable real Razorpay SDK path (`razorpay_client`). Wire up credentials via env vars; keep manual HMAC path as fallback.
- Configure Twilio properly so OTP mock fallback in `backend/main.py` is not default in production.
- Remove `src/utils/adminSetup.ts` from shipped client bundle.
- Remove `mock-admin-token` fallback in `src/components/auth/LoginForm.tsx`.

### Phase 3 — Mock-to-real data migration

Replace mock storefront data with existing real backend routes:

1. Catalog (`src/utils/mockData.ts` → real product/catalog endpoint)
2. Categories (`src/utils/mockData.ts` → real endpoint)
3. Testimonials/stats (`src/utils/mockData.ts` → real endpoint or flag missing backend route)
4. Messages (`src/utils/mockData.ts` → real endpoint or flag unbacked)
5. Wishlist — reconcile mixed frontend/backend state so backend is source of truth with optimistic local cache.

_Note: Do not modify Auth, Orders, Notifications, Payments, Recommendations, Lender products, or Search without verifying current integration status._

### Phase 4 — Documentation sync

After each phase lands, update `docs/project-report.md`:

- Integration-status table
- Technical-debt list
- Repository-facts section

---

## 3. Guardrails

- **Scope isolation**: One phase = one branch = one PR.
- **Never delete before verifying**: Search the full repository (build configs, TS paths, CI scripts) before removing files. Report findings before deleting.
- **Admin surface is separate**: `src/admin/` uses `payent:admin:*` storage keys and an intentional offline mock interceptor. Do not conflate this with customer mock data.
- **No schema changes without approval**: `backend/database.py` raw SQL and `MOCK_*` in-memory fallbacks are load-bearing for degraded mode.
- **Secrets**: Never commit or log real secret values.
- **Stop and ask** if a mock source lacks a real backend equivalent, if deleting a file breaks builds, or if Razorpay SDK re-enable requires missing credentials.

---

## 4. Definition of Done (per phase)

- Build passes (`frontend` and `backend`) with no new lint/type errors.
- No dangling imports/references to removed files.
- `docs/project-report.md` updated.
- Clear PR description detailing exact changes mapped to roadmap items.
