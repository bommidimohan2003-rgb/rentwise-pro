@echo off
echo ===================================================
echo             Starting Payent Backend API
echo ===================================================
cd /d "%~dp0"

if exist "..\.venv\Scripts\python.exe" (
    echo [INFO] Activating virtual environment ..\.venv
    ..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
) else (
    echo [WARNING] Local virtual environment not found. Using global python...
    python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
)
pause
