@echo off
echo ========================================
echo    InsPecPro - Unified Startup
echo    Backend + Frontend Management
echo ========================================
echo.

REM Check if services are already running
echo Checking if services are already running...
netstat -an | findstr :8000 >nul 2>&1
if not errorlevel 1 (
    echo WARNING: Backend already running on port 8000
    echo Use stop.bat first to stop existing services
    pause
    exit /b 1
)

netstat -an | findstr :3000 >nul 2>&1
if not errorlevel 1 (
    echo WARNING: Frontend already running on port 3000
    echo Use stop.bat first to stop existing services
    pause
    exit /b 1
)

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
echo Checking prerequisites...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.8 or higher
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 16 or higher
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm not found. Please reinstall Node.js
    pause
    exit /b 1
)

echo Prerequisites check passed!
echo.

REM Check if .env file exists
if not exist "backend\.env" (
    echo WARNING: backend\.env file not found
    echo Please create .env file from .env.example
    pause
    exit /b 1
)

echo Installing/updating dependencies...
echo [1/2] Backend dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)

echo [2/2] Frontend dependencies...
cd ..\frontend
npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo Starting services...
echo [1/2] Starting Backend (FastAPI)...
cd backend
start "InsPecPro Backend" cmd /k "python main.py"
cd ..

echo Waiting for backend to start...
timeout /t 8 /nobreak >nul

REM Check if backend started successfully
netstat -an | findstr :8000 >nul 2>&1
if errorlevel 1 (
    echo ERROR: Backend failed to start on port 8000
    echo Check the backend terminal window for errors
    pause
    exit /b 1
)
echo Backend started successfully on http://localhost:8000

echo [2/2] Starting Frontend (Next.js)...
cd frontend
start "InsPecPro Frontend" cmd /k "npm run dev"
cd ..

echo Waiting for frontend to start...
timeout /t 10 /nobreak >nul

REM Check if frontend started successfully
netstat -an | findstr :3000 >nul 2>&1
if errorlevel 1 (
    echo WARNING: Frontend may not have started on port 3000
    echo Check the frontend terminal window
) else (
    echo Frontend started successfully on http://localhost:3000
)

echo.
echo ========================================
echo    InsPecPro Services Started!
echo ========================================
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Opening application in browser...
start http://localhost:3000

echo.
echo Services are running in separate windows
echo Use stop.bat to stop all services
echo.

:END
pause