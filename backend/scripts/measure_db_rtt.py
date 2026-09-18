import os
import sys
import time
import socket

# Ensure backend in path
sys.path.insert(0, r"c:\Users\bommi\payent_project\rentwise-pro\backend")
from database import get_db_pool, get_db_connection, MYSQL_HOST, MYSQL_PORT, get_ssl_kwargs
import pymysql

print("Measuring raw TCP latency to TiDB Cloud...")
host = MYSQL_HOST
port = MYSQL_PORT

latencies = []
for i in range(5):
    t0 = time.perf_counter()
    s = socket.create_connection((host, port), timeout=5)
    t1 = time.perf_counter()
    s.close()
    lat = (t1 - t0) * 1000
    latencies.append(lat)
    print(f"  TCP connect {i+1}: {lat:.2f} ms")

avg_tcp = sum(latencies) / len(latencies)
print(f"Average TCP connect RTT: {avg_tcp:.2f} ms")

print("\nMeasuring PyMySQL raw connect + TLS handshake...")
ssl_kwargs = get_ssl_kwargs()
tls_connect_times = []
for i in range(3):
    t0 = time.perf_counter()
    conn = pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=os.getenv("MYSQL_USER", "2Q1Kqj7R9YlYtqC.root"),
        password=os.getenv("MYSQL_PASSWORD", "Bomi@2003"),
        database=os.getenv("MYSQL_DB", "payent_db"),
        cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=5,
        **ssl_kwargs
    )
    t1 = time.perf_counter()
    tls_connect_times.append((t1 - t0) * 1000)
    
    # Measure raw query RTT over open connection
    q_times = []
    for _ in range(5):
        qt0 = time.perf_counter()
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchall()
        qt1 = time.perf_counter()
        q_times.append((qt1 - qt0) * 1000)
    conn.close()
    print(f"  Connect+TLS {i+1}: {tls_connect_times[-1]:.2f} ms | Query RTT avg: {sum(q_times)/len(q_times):.2f} ms (min {min(q_times):.2f} ms, max {max(q_times):.2f} ms)")

print(f"\nAverage TLS Handshake + Connect: {sum(tls_connect_times)/len(tls_connect_times):.2f} ms")
