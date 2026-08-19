"""Phase 3 – Data layer audit: MOCK_* references, connection handling, token_blocklist."""
import re, os

# 1. MOCK_* / mockData references reachable from production
src_files = []
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in {'node_modules', '.git', '.output', 'dist', '__pycache__'}]
    for fn in files:
        if fn.endswith(('.py', '.ts', '.tsx')):
            src_files.append(os.path.join(root, fn))

MOCK_PATTERNS = re.compile(r'(MOCK_CUSTOM_PRODUCTS|MOCK_WISHLISTS|mock_prices|mock_titles|mockData|MOCK_USERS|MOCK_ORDERS|mock_admin_token)', re.I)

print("=== MOCK_* / mockData references ===")
hits = []
for fp in src_files:
    try:
        with open(fp, encoding='utf-8', errors='ignore') as f:
            for i, line in enumerate(f, 1):
                if MOCK_PATTERNS.search(line) and not line.strip().startswith('//') and not line.strip().startswith('#'):
                    hits.append((fp.replace('.\\', ''), i, line.strip()[:100]))
    except:
        pass

if hits:
    for fp, ln, content in hits:
        print(f"  {fp}:{ln}  →  {content}")
else:
    print("  NONE – all mock references appear removed.")

# 2. token_blocklist in-memory vs DB
print("\n=== token_blocklist implementation ===")
for fp in src_files:
    if 'token' in fp.lower() or 'auth' in fp.lower() or 'database' in fp.lower() or 'main' in fp.lower():
        try:
            with open(fp, encoding='utf-8', errors='ignore') as f:
                for i, line in enumerate(f, 1):
                    if 'blocklist' in line.lower() or 'token_blocklist' in line.lower():
                        print(f"  {fp}:{i}  →  {line.strip()[:120]}")
        except:
            pass

# 3. DB connection management
print("\n=== Connection management in database.py ===")
try:
    with open('backend/database.py', encoding='utf-8') as f:
        lines = f.readlines()
    for i, line in enumerate(lines, 1):
        if any(k in line.lower() for k in ['pool', 'connect(', 'conn.close', 'connection', 'ping']):
            print(f"  L{i:4d}  {line.rstrip()[:120]}")
except Exception as e:
    print(f"  ERROR: {e}")

# 4. Duplicate route detection
print("\n=== Duplicate route definitions ===")
with open('backend/main.py', encoding='utf-8') as f:
    content = f.read()
route_defs = re.findall(r'@app\.(get|post|put|delete|patch)\(["\']([^"\']+)', content)
from collections import Counter
counts = Counter((m, p) for m, p in route_defs)
for (method, path), count in counts.items():
    if count > 1:
        print(f"  DUPLICATE: {method.upper()} {path} x{count}")
if not any(c > 1 for c in counts.values()):
    print("  NONE – no duplicate routes.")
