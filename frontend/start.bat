@echo off
echo ========================================
echo InsPecPro Frontend - Starting Development Server
echo ========================================
echo.

echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo ERROR: Dependencies not installed!
    echo Please run install.bat first
    pause
    exit /b 1
)
echo.

echo Starting development server...
echo.
echo Server will be available at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
call npm run dev
