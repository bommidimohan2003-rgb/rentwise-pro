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
- **Seed Users**:
  - `admin@payent.com` (Sarah Connor, Admin account)
  - `alex@example.com` (Alex Mercer, Lender/Agent account)
  - `emily@example.com` (Emily Davis, Lender/Agent account)
  - `michael@example.com` (Michael Chang, Customer account)
  - `jessica@example.com` (Jessica Ross, Customer account)
- **Seed Listings**: Cameras, drones, laptops, audio recorders (IDs `p-1` through `p-6` owned by `alex` and `emily`).
- **Seed Orders**: Initial mock bookings `b-1`, `b-2`, and `b-3`.
- **Seed Transactions**: Initial matching mock transactions `tx-1`, `tx-2`, `tx-3`.
- **Seed Tickets, Reports, & Logs**: Illustrated support tickets, review ratings, and audit entries.

### Real User Data
All user registrations via `/register` (including admin registration using `ADMIN_SETUP_CODE`), product listings uploaded via the lender dashboard, wishlists, messages, and orders submitted through checkout are **real user data**. They do not use mock prefixes and persist permanently.

---

## How to Run & Verify

1. **Start Backend**:
   - Execute `backend/run.bat` (Windows) or `backend/run.sh` (Linux/macOS) to boot the FastAPI uvicorn server on `http://127.0.0.1:8000`.
   - On startup, the script automatically verifies and migrates columns on the MySQL instance (credentials loaded from `.env`).

2. **Start Frontend**:
   - Run `npm install` and then `npm run dev` to start the local development server.
   - Go to `http://localhost:5173`.

3. **Verify Connection**:
   - Log in to the admin panel using `admin@payent.com` / `admin@123` or register a custom admin with your `ADMIN_SETUP_CODE`.
   - The Topbar should connect directly to the live server.
   - Stop the backend server to see the Topbar instantly reflect `⚠️ Offline Demo Mode`, fallback gracefully, and restore real-time state as soon as the server is booted back up.
