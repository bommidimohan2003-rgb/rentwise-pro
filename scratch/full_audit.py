"""Full audit script - all phases."""
import re, os, sys
from collections import Counter

os.environ['PYTHONIOENCODING'] = 'utf-8'

# ============================================================
# Load main.py content once
# ============================================================
with open('backend/main.py', encoding='utf-8') as f:
    main_content = f.read()
main_lines = main_content.split('\n')

with open('backend/database.py', encoding='utf-8') as f:
    db_content = f.read()

# ============================================================
# Phase 1 - api/index.py import check
# ============================================================
print("=== PHASE 1: api/index.py ===")
with open('api/index.py', encoding='utf-8') as f:
    idx = f.read()
print(idx)

# ============================================================
# Phase 3 - MOCK_* references
# ============================================================
print("\n=== PHASE 3a: MOCK_* / mockData references ===")
src_files = []
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in {'node_modules', '.git', '.output', 'dist', '__pycache__'}]
    for fn in files:
        if fn.endswith(('.py', '.ts', '.tsx')):
            src_files.append(os.path.join(root, fn))

MOCK_PATTERNS = re.compile(r'(MOCK_CUSTOM_PRODUCTS|MOCK_WISHLISTS|mock_prices|mock_titles|MOCK_USERS|MOCK_ORDERS|mock.admin.token)', re.I)
hits = []
for fp in src_files:
    try:
        with open(fp, encoding='utf-8', errors='ignore') as f:
            for i, line in enumerate(f, 1):
                stripped = line.strip()
                if MOCK_PATTERNS.search(line) and not stripped.startswith('//') and not stripped.startswith('#'):
                    hits.append((fp.replace('.\\', ''), i, stripped[:100]))
    except:
        pass

if hits:
    for fp, ln, content in hits:
        print(f"  {fp}:{ln}  -> {content}")
else:
    print("  NONE - all mock references appear removed.")

# mockData.ts usage
print("\n=== PHASE 3b: mockData.ts import usage ===")
mockdata_hits = []
for fp in src_files:
    if fp.endswith('.ts') or fp.endswith('.tsx'):
        try:
            with open(fp, encoding='utf-8', errors='ignore') as f:
                for i, line in enumerate(f, 1):
                    if 'mockData' in line and 'import' in line:
                        mockdata_hits.append((fp.replace('.\\', ''), i, line.strip()[:100]))
        except:
            pass
if mockdata_hits:
    for fp, ln, content in mockdata_hits:
        print(f"  {fp}:{ln}  -> {content}")
else:
    print("  NONE - mockData.ts not imported anywhere.")

# ============================================================
# Phase 3c - DB connection handling
# ============================================================
print("\n=== PHASE 3c: DB connection management ===")
pool_refs = [l.strip() for l in db_content.split('\n') if any(k in l.lower() for k in ['pool', 'autocommit', 'ping(', 'connect(', 'disconnect', 'close()'])]
for l in pool_refs[:20]:
    print(f"  {l[:120]}")

# ============================================================
# Phase 3d - token_blocklist storage
# ============================================================
print("\n=== PHASE 3d: token_blocklist implementation ===")
blocklist_hits = []
for fp in ['backend/database.py', 'backend/auth.py', 'backend/main.py']:
    try:
        with open(fp, encoding='utf-8') as f:
            for i, line in enumerate(f, 1):
                if 'blocklist' in line.lower():
                    blocklist_hits.append((fp, i, line.strip()[:120]))
    except:
        pass
for fp, ln, l in blocklist_hits[:15]:
    print(f"  {fp}:{ln}  -> {l}")

# ============================================================
# Phase 4 - Duplicate routes
# ============================================================
print("\n=== PHASE 4: Duplicate route definitions ===")
route_defs = re.findall(r'@app\.(get|post|put|delete|patch)\(\"(/api/[^\"]+)\"', main_content)
counts = Counter(route_defs)
found_dup = False
for (method, path), count in counts.items():
    if count > 1:
        print(f"  DUPLICATE: {method.upper()} {path} x{count}")
        found_dup = True
if not found_dup:
    print("  NONE - no duplicate routes.")

# ============================================================
# Phase 5 - Payment security
# ============================================================
print("\n=== PHASE 5: Payment webhook security ===")
wh_idx = main_content.find('/api/payments/webhook')
wh_block = main_content[wh_idx:wh_idx+3000]
print(f"  Signature verification: {'YES' if ('signature' in wh_block.lower() or 'hmac' in wh_block.lower()) else 'NO'}")
print(f"  Idempotency check: {'YES' if ('idempotent' in wh_block.lower() or 'already_processed' in wh_block.lower() or 'processed_webhooks' in wh_block.lower()) else 'NO'}")

razorpay_lines = [l.strip() for l in main_lines if 'razorpay_client' in l and ('= None' in l or 'razorpay.Client' in l or 'client =' in l.lower())]
print(f"  Razorpay client lines:")
for l in razorpay_lines[:5]:
    print(f"    {l[:100]}")

secret_leak = [l.strip() for l in main_lines if 'RAZORPAY_SECRET' in l and ('response' in l.lower() or 'return' in l.lower() or 'print' in l.lower())]
print(f"  Razorpay secret in response body: {'RISK' if secret_leak else 'OK'}")

# ============================================================
# Phase 6 - Error handling / stack trace leaks
# ============================================================
print("\n=== PHASE 6: Error handling / stack trace leaks ===")
leak_candidates = []
for i, line in enumerate(main_lines, 1):
    stripped = line.strip()
    if ('traceback' in stripped.lower() or 'str(e)' in stripped or 'str(err)' in stripped or 'str(ex)' in stripped) and ('detail' in stripped or 'return' in stripped):
        leak_candidates.append((i, stripped[:120]))
print(f"  Potential error detail leaks: {len(leak_candidates)}")
for ln, l in leak_candidates[:10]:
    print(f"    L{ln}: {l}")

# ============================================================
# Phase 4a - Admin route protection
# ============================================================
print("\n=== PHASE 4a: Admin route protection check ===")
unprotected = []
for i, line in enumerate(main_lines):
    if re.search(r'@app\.(get|post|put|delete)\(\"/api/admin/', line):
        block = '\n'.join(main_lines[i:i+6])
        if 'check_admin_user' not in block:
            unprotected.append((i+1, line.strip()[:80]))

print(f"  Unprotected /api/admin/* routes: {len(unprotected)}")
for ln, l in unprotected:
    print(f"    L{ln}: {l}")

# ============================================================
# Phase 4b - Rate limiting
# ============================================================
print("\n=== PHASE 4b: Rate limiting ===")
rl_lines = [(i+1, l.strip()) for i, l in enumerate(main_lines) if 'rate_limit' in l.lower() or 'check_rate_limit' in l.lower()]
print(f"  Rate limit references: {len(rl_lines)}")
for ln, l in rl_lines[:10]:
    print(f"    L{ln}: {l[:100]}")

# Rate limit IP detection
ip_lines = [(i+1, l.strip()) for i, l in enumerate(main_lines) if 'x-forwarded-for' in l.lower() or 'client.host' in l.lower() or 'request.client' in l.lower()]
print(f"\n  IP detection references:")
for ln, l in ip_lines[:10]:
    print(f"    L{ln}: {l[:100]}")

print("\n=== DONE ===")
