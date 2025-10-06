@echo off
echo.
echo ========================================
echo    InsPecPro - QA Inspection System
echo ========================================
echo.
echo Starting InsPecPro services...
echo.

echo [1/2] Starting Backend (FastAPI)...
cd backend
start "InsPecPro Backend" cmd /k "python main.py"
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (Next.js)...
cd ..\frontend
start "InsPecPro Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo    InsPecPro Services Started!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Test Accounts:
echo   Admin: admin / admin123
echo   Inspector: inspector1 / inspector123
echo   Supervisor: supervisor1 / supervisor123
echo   Manager: manager1 / manager123
echo.
echo Press any key to open the application...
pause >nul

start http://localhost:3000

echo.
echo InsPecPro is now running!
echo Close this window when done testing.
pause
