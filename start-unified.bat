@echo off
echo ========================================
echo    InsPecPro - Unified Startup
echo    Backend + Frontend in One Window
echo ========================================
echo.

REM Check prerequisites
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found
    pause
    exit /b 1
)

echo [1/3] Installing backend dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo [2/3] Installing frontend dependencies...
cd ..\frontend
npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo [3/3] Starting services...
cd ..

echo.
echo ========================================
echo Starting Backend in background...
echo ========================================
cd backend
start /b /min python main.py
cd ..

echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Starting Frontend...
echo ========================================
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Opening browser...
start http://localhost:3000

echo.
echo Frontend will start now (Ctrl+C to stop all)
echo ========================================
cd frontend
npm run dev