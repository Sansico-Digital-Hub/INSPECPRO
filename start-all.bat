@echo off
echo ========================================
echo Starting Sanalyze Application
echo ========================================

echo.
echo Checking dependencies...
if not exist "backend\requirements.txt" (
    echo ERROR: Backend requirements.txt not found
    echo Please run install-dependencies.bat first
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ERROR: Frontend package.json not found
    echo Please run install-dependencies.bat first
    pause
    exit /b 1
)

if not exist "frontend\node_modules" (
    echo ERROR: Frontend dependencies not installed
    echo Please run install-dependencies.bat first
    pause
    exit /b 1
)

echo.
echo Starting Backend Server...
echo ----------------------------------------
start "InsPecPro Backend" cmd /k "cd backend && python main.py"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server...
echo ----------------------------------------
start "Sanalyze Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Sanalyze Application is starting...
echo ========================================
echo.
echo Backend: Running on http://localhost:8000
echo Frontend: Running on http://localhost:3002
echo.
echo Both servers are starting in separate windows.
echo To stop the application, run stop-all.bat
echo or close both terminal windows.
echo ========================================

pause