import os
import sys

# Ensure backend directory and root directory are absolute paths in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", "backend"))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from backend.main import app
except ImportError:
    from main import app

# Vercel serverless entrypoint handler
handler = app
