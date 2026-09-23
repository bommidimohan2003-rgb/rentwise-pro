#!/usr/bin/env python3
"""
Test script for PAYENT Admin endpoints.
Queries all admin routes directly to verify status codes, real database responses, and schemas.
"""
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from auth import create_access_token
from database import fetch_one

client = TestClient(app)

admin_user = fetch_one("SELECT email, role FROM users WHERE LOWER(role) IN ('admin', 'superadmin') LIMIT 1")
if not admin_user:
    any_user = fetch_one("SELECT email FROM users LIMIT 1")
    admin_email = any_user["email"] if any_user else "admin@payent.in"
else:
    admin_email = admin_user["email"]

print(f"Using admin identity: {admin_email}")
token = create_access_token({"sub": admin_email, "role": "admin"})
headers = {"Authorization": f"Bearer {token}"}

endpoints = [
    ("GET", "/api/admin/auth/me"),
    ("GET", "/api/admin/users"),
    ("GET", "/api/admin/agents"),
    ("GET", "/api/admin/products"),
    ("GET", "/api/admin/categories"),
    ("GET", "/api/admin/bookings"),
    ("GET", "/api/admin/payments"),
    ("GET", "/api/admin/reviews"),
    ("GET", "/api/admin/reports"),
    ("GET", "/api/admin/notifications"),
    ("GET", "/api/admin/support"),
    ("GET", "/api/admin/activity-logs"),
    ("GET", "/api/admin/dashboard/stats"),
    ("GET", "/api/admin/dashboard/charts?days=30"),
    ("GET", "/api/admin/dashboard/activities"),
    ("GET", "/api/admin/settings"),
]

print("=" * 70)
print("AUDITING ALL ADMIN ENDPOINTS")
print("=" * 70)

for method, path in endpoints:
    try:
        if method == "GET":
            res = client.get(path, headers=headers)
        elif method == "POST":
            res = client.post(path, headers=headers, json={})
        
        status_code = res.status_code
        data = res.json() if res.headers.get("content-type", "").startswith("application/json") else res.text
        item_count = len(data) if isinstance(data, list) else (len(data.keys()) if isinstance(data, dict) else "N/A")
        print(f"[{status_code}] {method} {path} -> count/keys: {item_count}")
        if status_code != 200:
            print(f"    ERROR DETAIL: {data}")
    except Exception as e:
        print(f"[EXCEPTION] {method} {path}: {e}")

print("=" * 70)
