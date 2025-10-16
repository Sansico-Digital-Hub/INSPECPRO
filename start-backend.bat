@echo off
echo ========================================
echo    InsPecPro - Starting Backend Only
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo [1/2] Installing backend dependencies...
cd backend
if not exist "requirements.txt" (
    echo ERROR: requirements.txt not found
    pause
    exit /b 1
)

pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [2/2] Starting FastAPI Backend...
echo.
echo ========================================
echo Backend running on: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo ========================================
echo.
echo Press Ctrl+C to stop the backend
echo.

python main.py