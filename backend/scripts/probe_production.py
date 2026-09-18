import urllib.request
import urllib.error
import time
import json

base_url = "https://rentwise-pro-production.up.railway.app"

endpoints = [
    ("/api/health/live", "GET"),
    ("/api/health/ready", "GET"),
    ("/api/categories", "GET"),
    ("/api/products/custom/public", "GET"),
]

print("=" * 70)
print(f"PROBING LIVE RAILWAY PRODUCTION ENDPOINTS ({base_url})")
print("=" * 70)

for path, method in endpoints:
    url = f"{base_url}{path}"
    t0 = time.perf_counter()
    req = urllib.request.Request(url, method=method, headers={"User-Agent": "Payent-SRE-Monitor/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            t1 = time.perf_counter()
            lat = (t1 - t0) * 1000
            status = resp.status
            data = resp.read()
            req_id = resp.headers.get("x-request-id", "None")
            print(f"{path:<30} | Status: {status} | Latency: {lat:6.2f}ms | Req-ID: {req_id} | Bytes: {len(data)}")
    except urllib.error.HTTPError as e:
        t1 = time.perf_counter()
        lat = (t1 - t0) * 1000
        print(f"{path:<30} | HTTP Error {e.code} | Latency: {lat:6.2f}ms")
    except Exception as e:
        print(f"{path:<30} | Error: {e}")
