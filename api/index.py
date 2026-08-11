import os
import sys

# Ensure backend directory is in python module path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.main import app

# Vercel serverless entrypoint handler
handler = app
