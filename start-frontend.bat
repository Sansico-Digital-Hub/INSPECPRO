@echo off
echo ========================================
echo    InsPecPro - Starting Frontend Only
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo [1/2] Installing frontend dependencies...
cd frontend
if not exist "package.json" (
    echo ERROR: package.json not found
    pause
    exit /b 1
)

npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [2/2] Starting Next.js Frontend...
echo.
echo ========================================
echo Frontend running on: http://localhost:3000
echo ========================================
echo.
echo Press Ctrl+C to stop the frontend
echo.

npm run dev