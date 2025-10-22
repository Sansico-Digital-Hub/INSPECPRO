@echo off
echo ========================================
echo InsPecPro Frontend - Installation Script
echo ========================================
echo.

echo [1/3] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js version:
node --version
echo.

echo [2/3] Installing dependencies...
echo This may take a few minutes...
echo.
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo.

echo [3/3] Installation complete!
echo.
echo ========================================
echo Next steps:
echo 1. Run: npm run dev
echo 2. Open: http://localhost:3002
echo 3. Login with test accounts:
echo    - Admin: admin / admin123
echo    - Inspector: inspector / inspector123
echo    - Supervisor: supervisor / supervisor123
echo    - Management: management / management123
echo ========================================
echo.
pause
