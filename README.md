# Payent Tech-Gear Rental Marketplace

This repository contains the premium peer-to-peer tech gear rental platform, featuring a React 19 + Vite 8 frontend and a FastAPI + MySQL backend.

---

## Admin Dashboard API & Data Persistence

The admin portal dashboard (`/admin`) is fully backed by the FastAPI backend server (`/api/admin/*`) and persists all details to a local MySQL instance.

### Data Model & Sync Design

- **Users & Agents**: Agents are retrieved dynamically from the `users` table based on roles (`agent` or `lender`) or active product listings. Update, delete, suspend, and activate requests are processed and persisted in the MySQL database.
- **Products & Categories**: Features like product approval/rejection, visibility hiding, and promotional feature flags are saved. Product documents and images arrays are serialized as JSON strings in the MySQL schema.
- **Bookings & Payments**: Orders created on the public renter portal sync with the `payments` table. Admin actions like booking cancellation, completions, and transaction refunds directly update both order statuses and UPI/Card transaction records in MySQL.
- **Support Tickets, Product Reports, & Reviews**: Support requests, user tickets, and reported listings read and write real entries in the database. Product suspensions and user bans instantly execute cascade updates on listings and roles.
- **Settings & Settings Profiles**: Site configurations (contact emails, banner texts, SEO titles) are managed through a persistent `admin_settings` row.
- **Activity Logs**: Administrative operations trigger an audit record inserted into the `admin_logs` table.

---

## Seed Data vs. Real User Data

When the database is initialized (`init_db` in `backend/database.py`), default data is seeded **only if the respective tables are empty**. This populates the interface with realistic test listings while keeping actual operations separate.

### Illustrative Seed Data (Seeded on Empty DB)

### Admin Account Creation

- **Admin Registration**: Register a new account via `/register` providing your secure `ADMIN_SETUP_CODE` (configured in `backend/config.py`).
- **Seed Listings**: Cameras, drones, laptops, audio recorders (IDs `p-1` through `p-6`).

---

35: ## How to Run & Verify
36: 
37: 1. **Start Backend**:
38:    - Execute `backend/run.bat` (Windows) or `backend/run.sh` (Linux/macOS) to boot the FastAPI uvicorn server on `http://127.0.0.1:8000`.
39:    - On startup, the script automatically verifies and migrates columns on the MySQL instance (credentials loaded from `.env`).
40: 
41: 2. **Start Frontend**:
42:    - Run `npm install` and then `npm run dev` to start the local development server.
43:    - Go to `http://localhost:5173`.
44: 
45: 3. **Verify Connection**:
46:    - Register your admin account at `/register` using your `ADMIN_SETUP_CODE` (default: `PAYENT-ADMIN-2026`).
47:    - Log in to the admin panel using your registered admin credentials.
48:    - The Topbar should connect directly to the live server.
49:    - Stop the backend server to see the Topbar instantly reflect `⚠️ Offline Demo Mode`, fallback gracefully, and restore real-time state as soon as the server is booted back up.
50: 
51: ---
52: 
53: ## Production Deployment Architecture
54: 
55: The platform is configured for production hosting with the following target stack:
56: - **Frontend**: Vercel (React 19 / Vite SPA via `vercel.json`)
57: - **Backend**: Railway (FastAPI ASGI Service via `railway.json` & `backend/Dockerfile`)
58: - **Database**: TiDB Cloud (Serverless/Dedicated MySQL with SSL)
59: - **Payments**: Razorpay Verified HMAC Webhooks (`/api/payments/webhook`)
60: 
61: For step-by-step instructions on setting up environment variables and deploying, see [docs/deployment-guide.md](docs/deployment-guide.md).

