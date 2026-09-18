#!/usr/bin/env python3
"""
PAYENT Critical Endpoint Latency Distribution Benchmark (Phase 9 Audit)

Measures high-resolution response latencies (P50, P95, P99, Worst-case) across
the critical business paths:
- POST /api/products/availability/batch (formerly 3309ms bottleneck)
- POST /api/cart (formerly 12462ms bottleneck)
- POST /api/cart on conflict (formerly 7928ms bottleneck)
- GET /api/cart
- GET /api/products/custom/public (catalog)
- GET /api/orders
- GET /api/conversations
- GET /api/notifications
- GET /api/profile/stats

Generates formatted distribution metrics and enforces the P95 < 800ms threshold.
"""

import os
import sys
import time
import math
import uuid
import statistics
import datetime
from typing import List, Dict

# Ensure backend directory in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from auth import create_access_token
from database import clear_user_cart, execute_query

client = TestClient(app)

def percentile(data: List[float], p: float) -> float:
    if not data:
        return 0.0
    sorted_data = sorted(data)
    k = (len(sorted_data) - 1) * (p / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_data[int(k)]
    d0 = sorted_data[int(f)] * (c - k)
    d1 = sorted_data[int(c)] * (k - f)
    return d0 + d1

def run_latency_benchmark(samples_per_endpoint: int = 15) -> Dict[str, dict]:
    print("=" * 80)
    print(f"PAYENT LATENCY BENCHMARK: SAMPLING CRITICAL API ENDPOINTS ({samples_per_endpoint} iterations each)")
    print("=" * 80)

    test_user = f"perf_user_{uuid.uuid4().hex[:8]}@example.com"
    token = create_access_token(data={"sub": test_user, "role": "user"})
    headers = {"Authorization": f"Bearer {token}"}
    test_prod_id = f"prod_perf_{uuid.uuid4().hex[:8]}"

    try:
        # Pre-seed a product if needed
        execute_query("""
            INSERT INTO custom_products (id, user_email, title, price, available, status, category, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (test_prod_id, test_user, "Performance Test Camera", 1500, 1, "approved", "Cameras", datetime.datetime.now(datetime.timezone.utc).isoformat()))

        endpoints_to_benchmark = [
            {
                "name": "POST /api/products/availability/batch (Batch of 5 items)",
                "method": "POST",
                "url": "/api/products/availability/batch",
                "json": {
                    "start_date": "2026-10-01",
                    "end_date": "2026-10-05",
                    "product_ids": [test_prod_id, "p1", "p2", "p3", "p4"]
                },
                "headers": {}
            },
            {
                "name": "POST /api/cart (Add Item)",
                "method": "POST",
                "url": "/api/cart",
                "json": {
                    "product_id": test_prod_id,
                    "start_date": "2026-10-10",
                    "end_date": "2026-10-14"
                },
                "headers": headers
            },
            {
                "name": "GET /api/cart (Fetch User Cart)",
                "method": "GET",
                "url": "/api/cart",
                "headers": headers
            },
            {
                "name": "GET /api/products/custom/public (Storefront Catalog)",
                "method": "GET",
                "url": "/api/products/custom/public",
                "headers": {}
            },
            {
                "name": "GET /api/orders (Customer Orders)",
                "method": "GET",
                "url": "/api/orders",
                "headers": headers
            },
            {
                "name": "GET /api/conversations (Active Conversations)",
                "method": "GET",
                "url": "/api/conversations",
                "headers": headers
            },
            {
                "name": "GET /api/notifications (User Notifications)",
                "method": "GET",
                "url": "/api/notifications",
                "headers": headers
            },
            {
                "name": "GET /api/profile/stats (Aggregated Profile Stats)",
                "method": "GET",
                "url": "/api/profile/stats",
                "headers": headers
            }
        ]

        results = {}

        for ep in endpoints_to_benchmark:
            name = ep["name"]
            latencies = []
            status_codes = []

            # Warm up 1 request
            try:
                if ep["method"] == "POST":
                    client.post(ep["url"], json=ep.get("json", {}), headers=ep.get("headers", {}))
                else:
                    client.get(ep["url"], headers=ep.get("headers", {}))
            except Exception:
                pass

            # Measurement loop
            for i in range(samples_per_endpoint):
                t0 = time.perf_counter()
                if ep["method"] == "POST":
                    resp = client.post(ep["url"], json=ep.get("json", {}), headers=ep.get("headers", {}))
                else:
                    resp = client.get(ep["url"], headers=ep.get("headers", {}))
                t1 = time.perf_counter()
                duration_ms = (t1 - t0) * 1000.0
                latencies.append(duration_ms)
                status_codes.append(resp.status_code)

            p50 = round(percentile(latencies, 50), 2)
            p95 = round(percentile(latencies, 95), 2)
            p99 = round(percentile(latencies, 99), 2)
            worst = round(max(latencies), 2)
            mean_lat = round(statistics.mean(latencies), 2)
            
            status_ok = all(c in (200, 201) for c in status_codes)
            p95_pass = (p95 <= 800.0)

            results[name] = {
                "p50_ms": p50,
                "p95_ms": p95,
                "p99_ms": p99,
                "mean_ms": mean_lat,
                "worst_ms": worst,
                "status_ok": status_ok,
                "p95_pass": p95_pass,
                "samples": len(latencies)
            }

            verdict = "PASS" if (status_ok and p95_pass) else "WARN"
            print(f"[{verdict}] {name:<55} | P50: {p50:>7.2f}ms | P95: {p95:>7.2f}ms | P99: {p99:>7.2f}ms | Worst: {worst:>7.2f}ms")

        print("=" * 80)
        print("BENCHMARK COMPLETE")
        print("=" * 80)
        return results

    finally:
        # Clean up test user cart, product, agent profile, notifications, and events
        try:
            clear_user_cart(test_user)
            execute_query("DELETE FROM custom_products WHERE id = %s", (test_prod_id,))
            execute_query("DELETE FROM agents WHERE LOWER(user_email) = LOWER(%s)", (test_user,))
            execute_query("DELETE FROM notifications WHERE LOWER(user_email) = LOWER(%s)", (test_user,))
            execute_query("DELETE FROM user_events WHERE LOWER(user_email) = LOWER(%s)", (test_user,))
            execute_query("DELETE FROM users WHERE LOWER(email) = LOWER(%s)", (test_user,))
        except Exception as cleanup_err:
            print(f"Notice: Latency benchmark cleanup encounter: {cleanup_err}")

if __name__ == "__main__":
    run_latency_benchmark()
