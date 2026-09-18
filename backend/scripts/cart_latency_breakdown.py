#!/usr/bin/env python3
"""
PAYENT Phase 10A: High-Resolution Cart Latency Benchmark (AFTER OPTIMIZATION)
Profiles microsecond-level timing across the consolidated 2-round-trip pipeline:
  1. Auth lookup / verification (in-memory micro-cache)
  2. Connection acquisition / checkout
  3. Authoritative Read Bundle (SQL - Product, Owner, Conflicts, Cart Item)
  4. Availability evaluation (in-memory CPU)
  5. Atomic Write / Upsert (SQL - INSERT ... ON DUPLICATE KEY UPDATE)
  6. Response serialization
  7. End-to-end HTTP POST /api/cart
"""

import os
import sys
import time
import json
import uuid
import datetime
import statistics
from typing import Dict, List

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app, parse_date_safely
from auth import create_access_token
from database import (
    get_user,
    create_user,
    fetch_cart_validation_bundle,
    evaluate_product_availability,
    add_or_update_cart_item,
    clear_user_cart,
    get_db_connection,
    execute_query,
    invalidate_user_cache
)

client = TestClient(app)

def profile_cart_stages(iterations: int = 10):
    test_email = f"perf_p10a_{uuid.uuid4().hex[:8]}@example.com"
    # Create approved user in DB
    create_user(
        email=test_email,
        phone="+919876543210",
        password_hash="mock_hash_123",
        full_name="Perf Cart Runner",
        role="user",
        status="approved"
    )

    token = create_access_token(data={"sub": test_email, "role": "user"})
    headers = {"Authorization": f"Bearer {token}"}

    # Find a valid product ID from DB
    pid = None
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM custom_products WHERE status = 'approved' AND available = 1 LIMIT 1")
                prod_row = cur.fetchone()
                if prod_row:
                    pid = prod_row["id"]
        except Exception:
            pass
        finally:
            conn.close()

    if not pid:
        pid = "p-sony-a7iv"

    now_dt = datetime.datetime.now(datetime.timezone.utc)
    start_d = (now_dt + datetime.timedelta(days=10)).strftime("%Y-%m-%d")
    end_d = (now_dt + datetime.timedelta(days=14)).strftime("%Y-%m-%d")

    timings = {
        "auth_lookup": [],
        "conn_checkout": [],
        "read_bundle": [],
        "avail_eval": [],
        "atomic_write": [],
        "serialization": [],
        "pipeline_total": [],
        "http_e2e": []
    }

    print(f"\nProfiling Phase 10A Optimized Cart Pipeline ({iterations} runs)...")
    print(f"User: {test_email} | Product: {pid}\n")

    # Warm pool and user cache
    get_user(test_email)

    for i in range(iterations):
        clear_user_cart(test_email)

        # 1. Auth lookup (in-memory micro-cache)
        t0 = time.perf_counter()
        u = get_user(test_email)
        t1 = time.perf_counter()
        ms_auth = (t1 - t0) * 1000

        # 2. Connection acquisition / checkout
        t0 = time.perf_counter()
        c = get_db_connection()
        t1 = time.perf_counter()
        if c:
            c.close()
        ms_conn = (t1 - t0) * 1000

        # 3. Read Bundle (Round Trip 1)
        t0 = time.perf_counter()
        bundle = fetch_cart_validation_bundle(
            product_id=pid,
            user_email=test_email,
            start_date_str=start_d,
            end_date_str=end_d
        )
        t1 = time.perf_counter()
        ms_read_bundle = (t1 - t0) * 1000

        prod = bundle["product"] if bundle else {}

        # 4. Availability evaluation
        t0 = time.perf_counter()
        is_avail, status_val, reason = evaluate_product_availability(prod, booked_pids_set=set())
        t1 = time.perf_counter()
        ms_avail = (t1 - t0) * 1000

        # 5. Atomic Write (Round Trip 2)
        s_dt = parse_date_safely(start_d)
        e_dt = parse_date_safely(end_d)
        days = max(1, (e_dt - s_dt).days)
        daily_price = int(prod.get("price") or 100)
        total_price = daily_price * days

        t0 = time.perf_counter()
        item = add_or_update_cart_item(
            user_email=test_email,
            product_id=pid,
            start_date=start_d,
            end_date=end_d,
            days=days,
            daily_price=daily_price,
            total_price=total_price,
            product_details=prod,
            existing_item_id=bundle.get("existing_cart_item_id") if bundle else None
        )
        t1 = time.perf_counter()
        ms_atomic_write = (t1 - t0) * 1000

        # 6. Response serialization
        t0 = time.perf_counter()
        res_data = json.dumps({
            "success": True,
            "message": "Item added to cart successfully.",
            "item": item
        })
        t1 = time.perf_counter()
        ms_serialize = (t1 - t0) * 1000

        pipeline_sum = ms_auth + ms_conn + ms_read_bundle + ms_avail + ms_atomic_write + ms_serialize

        # 7. End-to-End HTTP POST /api/cart
        clear_user_cart(test_email)
        t0 = time.perf_counter()
        res = client.post("/api/cart", json={
            "product_id": pid,
            "start_date": start_d,
            "end_date": end_d
        }, headers=headers)
        t1 = time.perf_counter()
        ms_http = (t1 - t0) * 1000

        timings["auth_lookup"].append(ms_auth)
        timings["conn_checkout"].append(ms_conn)
        timings["read_bundle"].append(ms_read_bundle)
        timings["avail_eval"].append(ms_avail)
        timings["atomic_write"].append(ms_atomic_write)
        timings["serialization"].append(ms_serialize)
        timings["pipeline_total"].append(pipeline_sum)
        timings["http_e2e"].append(ms_http)

        print(f"Run {i+1:2d}: ReadBundle={ms_read_bundle:6.2f}ms | AtomicWrite={ms_atomic_write:6.2f}ms | Pipeline={pipeline_sum:6.2f}ms | HTTP E2E={ms_http:6.2f}ms")

    # Cleanup
    try:
        clear_user_cart(test_email)
        execute_query("DELETE FROM users WHERE email = %s", (test_email,))
        invalidate_user_cache(test_email)
    except Exception:
        pass

    return timings

def calculate_percentiles(vals: List[float]) -> Dict[str, float]:
    sorted_vals = sorted(vals)
    n = len(sorted_vals)
    p50 = sorted_vals[int(0.50 * (n - 1))]
    p95 = sorted_vals[int(0.95 * (n - 1))]
    p99 = sorted_vals[int(0.99 * (n - 1))]
    avg = statistics.mean(sorted_vals)
    return {"avg": avg, "p50": p50, "p95": p95, "p99": p99}

def print_benchmark_report(timings: Dict[str, List[float]]):
    print("\n" + "=" * 92)
    print("PAYENT PHASE 10A: CART LATENCY BENCHMARK REPORT (AFTER OPTIMIZATION)")
    print("=" * 92)
    print(f"{'METRIC / COMPONENT':<35} | {'AVG (ms)':<10} | {'P50 (ms)':<10} | {'P95 (ms)':<10} | {'P99 (ms)':<10}")
    print("-" * 92)

    labels = {
        "auth_lookup": "1. Auth Lookup (In-Memory MicroCache)",
        "conn_checkout": "2. Connection Checkout (Pool ping=1)",
        "read_bundle": "3. Read Bundle (1 SQL Round Trip)",
        "avail_eval": "4. Availability Evaluation (CPU)",
        "atomic_write": "5. Atomic Write (1 SQL Round Trip)",
        "serialization": "6. Response Serialization (CPU)",
        "pipeline_total": "TOTAL INTERNAL PIPELINE",
        "http_e2e": "END-TO-END HTTP POST /api/cart"
    }

    metrics = {}
    for key, label in labels.items():
        pcts = calculate_percentiles(timings[key])
        metrics[key] = pcts
        prefix = ">> " if "TOTAL" in label or "END-TO-END" in label else "   "
        print(f"{prefix + label:<35} | {pcts['avg']:9.2f} | {pcts['p50']:9.2f} | {pcts['p95']:9.2f} | {pcts['p99']:9.2f}")

    print("=" * 92)

    # Save metrics JSON for project report
    with open(os.path.join(backend_dir, "scripts", "phase10a_benchmark_results.json"), "w") as f:
        json.dump(metrics, f, indent=2)

if __name__ == "__main__":
    results = profile_cart_stages(iterations=10)
    print_benchmark_report(results)
