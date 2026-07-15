#!/bin/bash
echo "==================================================="
echo "            Starting Payent Backend API"
echo "==================================================="
cd "$(dirname "$0")"

if [ -f "../.venv/bin/python" ]; then
    echo "[INFO] Activating virtual environment ../.venv"
    ../.venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
elif [ -f "../.venv/Scripts/python" ]; then
    echo "[INFO] Activating virtual environment ../.venv"
    ../.venv/Scripts/python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
else
    echo "[WARNING] Local virtual environment not found. Using system python..."
    python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
fi
