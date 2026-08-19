import re
with open('src/pages/ProductDetails.tsx', encoding='utf-8') as f:
    content = f.read()
lines = content.split('\n')
for i, l in enumerate(lines, 1):
    if 'review' in l.lower() or ('product' in l.lower() and ('find' in l.lower() or 'mock' in l.lower() or 'import' in l.lower())):
        print(f'L{i}: {l.strip()[:120]}')
