import os
import sys
import time

sys.path.insert(0, r"c:\Users\bommi\payent_project\rentwise-pro\backend")
from database import MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB, get_ssl_kwargs
import pymysql
from dbutils.pooled_db import PooledDB

ssl_kwargs = get_ssl_kwargs()

for ping_val in [7, 1, 0]:
    pool = PooledDB(
        creator=pymysql,
        mincached=2,
        maxcached=5,
        maxshared=0,
        maxconnections=5,
        blocking=False,
        maxusage=1000,
        ping=ping_val,
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DB,
        cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=5,
        autocommit=True,
        **ssl_kwargs
    )
    
    # Warm pool
    c0 = pool.connection()
    c0.close()
    
    # Test connection acquisition + simple query
    times = []
    for _ in range(5):
        t0 = time.perf_counter()
        conn = pool.connection()
        t_acq = time.perf_counter()
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
        t_exec = time.perf_counter()
        conn.close()
        t_close = time.perf_counter()
        times.append(((t_acq - t0)*1000, (t_exec - t_acq)*1000, (t_close - t_exec)*1000, (t_close - t0)*1000))
    
    avg_acq = sum(x[0] for x in times) / len(times)
    avg_exec = sum(x[1] for x in times) / len(times)
    avg_total = sum(x[3] for x in times) / len(times)
    print(f"Ping {ping_val}: Acq={avg_acq:.2f}ms | Exec={avg_exec:.2f}ms | Total={avg_total:.2f}ms")
