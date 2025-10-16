@echo off
echo ========================================
echo Stopping InsPecPro Application
echo ========================================

echo.
echo Stopping Backend Server (Python)...
echo ----------------------------------------
taskkill /f /im python.exe 2>nul
if %errorlevel% equ 0 (
    echo Backend server stopped successfully
) else (
    echo No Python processes found or already stopped
)

echo.
echo Stopping Frontend Server (Node.js)...
echo ----------------------------------------
taskkill /f /im node.exe 2>nul
if %errorlevel% equ 0 (
    echo Frontend server stopped successfully
) else (
    echo No Node.js processes found or already stopped
)

echo.
echo Stopping any remaining npm processes...
echo ----------------------------------------
taskkill /f /im npm.cmd 2>nul
taskkill /f /im npm 2>nul

echo.
echo Closing InsPecPro terminal windows...
echo ----------------------------------------
taskkill /f /fi "WindowTitle eq InsPecPro Backend*" 2>nul
taskkill /f /fi "WindowTitle eq InsPecPro Frontend*" 2>nul

echo.
echo ========================================
echo InsPecPro Application has been stopped
echo ========================================
echo.
echo All servers and processes have been terminated.
echo You can now safely close this window.
echo ========================================

pause