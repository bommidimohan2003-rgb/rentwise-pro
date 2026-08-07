# Project Report

This report describes the current Payent project so the reader can plan changes.

## Outline

1. Overview
2. Tech Stack
3. Repository Layout
4. Frontend Architecture
5. Backend Architecture
6. Admin Panel
7. ML Features
8. Data Model
9. Integration Status
10. Technical Debt
11. Risks and Recommendations

## Overview

Payent is a peer-to-peer tech-gear rental marketplace. The product centers on renting premium devices and accessories from verified lenders, with customer-facing browsing, checkout, and account flows plus an admin console for operational oversight.

The current codebase is a working prototype rather than a fully production-hardened platform. It mixes real backend routes, local persistence, mock storefront data, and experimental ML modules. That mix is useful for evolution planning but it must be understood before making structural changes.

## Tech Stack

### Frontend

The frontend stack is built around React 19, TanStack Start, TanStack Router, TanStack Query, Tailwind CSS v4, Radix and shadcn-style UI primitives, Vite 8, and TypeScript 5. The repo also uses a large component library layer and a custom utility layer for search, analytics, storage, and auth.

### Backend

The backend is a FastAPI service served by uvicorn or gunicorn. Data access uses PyMySQL with raw SQL and no ORM. Authentication uses JWT and bcrypt, with Twilio and Razorpay integrations wired into the API surface.

### Deployment Model

The application uses Vercel for serverless deployment across both frontend (React/Vite) and backend (FastAPI Python ASGI serverless functions via `api/index.py` and `vercel.json`). MySQL serves as the external persistent datastore, and backend rate limiting is DB-backed across serverless execution instances.

## Repository Layout

The main areas are:

- `src/` for the customer-facing frontend application.
- `backend/` for the FastAPI service and its supporting modules.
- `src/admin/` for the separate admin app experience.
- `docs/` for documentation and design notes.
- Deployment config files at the repository root for hosting and environment setup.

A few repository facts matter for planning:

- `rentwise-pro-main/` duplicate snapshot has been removed as part of Phase 1.
- `api/index.py` orphaned serverless script has been removed.
- `scratch/` directory and `scratch/update_catalog.py` orphaned maintenance script have been removed.
- `requirements.txt` dependencies have been consolidated to include `razorpay`.

## Frontend Architecture

The frontend uses TanStack file-based routing. Route definitions live in `src/routes/`, the app shell is defined in `src/routes/__root.tsx`, and route bootstrap is handled in `src/router.tsx`.

The app uses two main layouts:

- `src/layouts/MainLayout.tsx` provides the standard public shell with the navbar and footer.
- `src/layouts/DashboardLayout.tsx` provides the authenticated dashboard shell with the navbar and sidebar.
- `src/components/auth/AuthLayout.tsx` is used for auth-facing screens.

Protected routes are wrapped by `src/components/common/ProtectedRoute.tsx`. The auth state is managed by `useAuth`, wishlist state by `useWishlist`, and theme state by `useTheme`. These hooks read and write browser storage under keys such as `payent:token`, `payent:currentUser`, `payent:wishlist`, `payent:theme`, and the admin-specific `payent:admin:*` values.

Search is split between a live backend path and an offline fallback. `src/utils/smartSearch.ts` calls the backend `POST /api/search`, while `src/utils/searchEngine.ts` provides an offline search engine for fallback and local development. Analytics follow a similar pattern. `src/utils/eventTracker.ts` batches events and sends them to `POST /api/events` so user behavior can be recorded without blocking the UI.

## Backend Architecture

The backend entrypoint in `backend/main.py` groups routes by responsibility:

- Health and root endpoints.
- User auth and account routes.
- User data routes for profile, wishlist, orders, notifications, and custom products.
- Payment routes for order creation, verification, webhook handling, and refund processing.
- Admin auth and admin management routes.
- WebSocket routes for realtime admin updates.
- Recommendation and event ingestion routes.
- Search routes for ML-powered discovery.

Authentication is implemented in `backend/auth.py`. Passwords are hashed with bcrypt and validated for strength, including a live Have I Been Pwned check. JWT tokens are created and decoded with explicit algorithm enforcement, and token revocation is supported through the `token_blocklist` mechanism. Rate limiting is also part of the auth flow to reduce brute-force abuse.

The Razorpay flow is present in the backend but partly disabled. The code supports create-order, verify, webhook, and refund actions. However, the SDK client is disabled with `razorpay_client = None`, and manual HMAC-SHA256 validation is the only active path for signature verification. The commented-out Razorpay block remains a large, legacy implementation artifact that should be reconciled before further payment work.

Data access is handled in `backend/database.py` through raw SQL helpers. The module provides helpers for connection management, query execution, schema initialization, CRUD operations, token revocation, rate limiting, and analytics persistence. It also includes in-memory `MOCK_*` fallbacks so the service can continue functioning during local or degraded environments.

## Admin Panel

The admin experience is a separate frontend surface under `src/admin/`. The admin pages include dashboards, users, agents, products, bookings, payments, reviews, reports, notifications, categories, analytics, settings, profile, support, and activity logs. Each page is paired with a service module under `src/admin/services/`, such as `auth.ts`, `users.ts`, `products.ts`, `payments.ts`, `notifications.ts`, `bookings.ts`, and `websocket.ts`.

The admin API routes in `backend/main.py` are protected by `Depends(check_admin_user)`. That dependency enforces admin-only access before the route can execute. The admin auth client in `src/admin/services/auth.ts` uses separate storage keys, including `payent:admin:token` and `payent:admin:current_user`, and targets the backend endpoint `/api/admin/auth/login`.

The admin panel also includes a WebSocket service in `src/admin/services/websocket.ts` that connects to the backend `/api/admin/ws` channel. The backend uses `broadcast_admin_event` to push admin events such as user updates, booking changes, and payment notifications. The admin API client also contains an offline mock interceptor that allows the admin UI to keep functioning when the backend is unreachable.

## ML Features

The ML layer has two main components.

- `backend/recommendations_ml.py` implements item-based collaborative filtering with cosine similarity. It uses a data-sufficiency gate before computing recommendations and persists similarity data into the `item_similarities` table.
- `backend/search_ml.py` implements TF-IDF indexing, cosine similarity ranking, Levenshtein-based spelling correction, and personalization re-ranking based on user behavior.

These modules are not yet fully integrated into every user journey, but they form the current experimentation boundary for smarter recommendations and search.

## Data Model

The database schema in `backend/database.py` is centered on MySQL tables such as `users`, `orders`, `custom_products`, `reviews`, `reports`, `user_events`, `item_similarities`, and supporting tables for auth, notifications, admin state, and payment records.

There is a notable drift between the frontend type definitions in `src/types/index.ts` and the database schema. The UI types contain fields that are mostly presentation-oriented, while the database schema includes more operational columns such as payment and admin audit data. Some payment fields that appear in the backend are not mirrored in the frontend types, and the current UI model is therefore not a complete representation of the backend contract.

## Integration Status

The project has a mixed integration state. Some customer-facing features are backed by real backend routes, while others are still served by mock storefront data.

| Customer route or feature | Data source | Status |
| --- | --- | --- |
| Auth | Backend auth routes and JWT flow | Real |
| Orders | Backend orders and order persistence routes | Real |
| Notifications | Backend notifications routes | Real |
| Payments | Backend payment routes and payment records | Real |
| Recommendations | Backend recommendation engine and event tracking | Real |
| Lender products | Backend custom product routes | Real |
| Search | Backend `/api/search` with ML search engine | Real |
| Wishlist items | Backend wishlist routes (`/api/wishlist`) & optimistic local cache | Real |
| Catalog | `GET /api/products/custom/public` & fallback static catalog | Mixed |
| Categories | Static storefront data (no public backend route) | Unbacked / Mock |
| Testimonials and stats | Static storefront data (no public backend route) | Unbacked / Mock |
| Messages | Static storefront data (no public backend route) | Unbacked / Mock |

The OTP flow has a mock fallback path in `backend/main.py` when Twilio credentials are absent. The checkout path also includes mock pricing and titles through `mock_prices` and `mock_titles` in the backend payment code path.

## Technical Debt

The main technical debt areas are clear:

- [RESOLVED Phase 1] The duplicate snapshot `rentwise-pro-main/`, `api/index.py`, and `scratch/` orphaned maintenance scripts have been removed.
- [RESOLVED Phase 1] Dependency artifacts consolidated across root `requirements.txt` and `backend/requirements.txt`.
- [RESOLVED Phase 2] The Razorpay SDK client is enabled and active in `backend/main.py` with full order creation, signature verification, webhook handling, and refund endpoints.
- [RESOLVED Phase 2] Hardcoded production defaults for `JWT_SECRET_KEY` and `MYSQL_PASSWORD` in `backend/config.py` now raise runtime errors in production mode if unset.
- [RESOLVED Phase 2] Removed `src/utils/adminSetup.ts` from client bundle.
- [RESOLVED Phase 2] Removed `mock-admin-token` fallback in `src/components/auth/LoginForm.tsx`.

## Risks and Recommendations

The highest-risk areas are the dead code, duplicate snapshots, and mock-first flows. Before adding new features, the project should remove dead code and duplicate directories, then harden configuration and replace mock storefront data where real backend routes already exist.

Recommended priorities:

1. Remove dead code and duplicates before feature work. This includes `rentwise-pro-main/`, `api/index.py`, `scratch/`, and the large commented Razorpay block.
2. Enable the real Razorpay SDK path and configure Twilio before production changes are attempted.
3. Replace mock storefront data with live backend data where real endpoints already exist.
4. Override all default secrets through environment variables and remove the client-exposed admin setup code.

## Ticket Scope

This ticket creates one new file only: `docs/project-report.md`. No source code changes are required because the task is documentation-only.

## Follow-Up Instructions

When the reader begins changing the project, use the Recommendations section as the backlog. Start with dead-code and duplicate removal, then move to secret hardening, and then tackle mock-to-real data migration. The report should stay in sync with the codebase as structural changes land, especially the integration-status table and the technical-debt list.
