import re

with open('backend/main.py', encoding='utf-8') as f:
    lines = f.readlines()

routes = []
for i, line in enumerate(lines, 1):
    m = re.match(r'\s*@app\.(get|post|put|delete|patch|websocket)\(["\']([^"\']+)', line)
    if m:
        routes.append((i, m.group(1).upper(), m.group(2)))

for ln, method, path in routes:
    print(f'L{ln:4d}  {method:<10} {path}')

print(f'\nTotal: {len(routes)} routes')
