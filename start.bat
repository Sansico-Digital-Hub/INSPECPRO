@echo off
echo ========================================
echo    InsPecPro - Unified Startup
echo    Backend + Frontend in One Terminal
echo ========================================
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell not available
    echo Falling back to basic startup...
    echo.
    goto BASIC_START
)

echo Starting with PowerShell (recommended)...
powershell -ExecutionPolicy Bypass -File "start-all.ps1"
goto END

:BASIC_START
echo [Basic Mode] Starting services separately...

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

echo Installing dependencies...
cd backend
pip install -r requirements.txt >nul 2>&1
cd ..\frontend
npm install >nul 2>&1
cd ..

echo Starting Backend in background...
cd backend
start /b /min python main.py
cd ..

echo Waiting for backend...
timeout /t 5 /nobreak >nul

echo Starting Frontend...
start http://localhost:3000
cd frontend
npm run dev

:END