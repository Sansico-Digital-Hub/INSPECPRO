@echo off
echo ========================================
echo    InsPecPro - Stop All Services
echo ========================================
echo.

REM Check if services are running
echo Checking running services...
netstat -an | findstr :8000 >nul 2>&1
set backend_running=%errorlevel%

netstat -an | findstr :3000 >nul 2>&1
set frontend_running=%errorlevel%

if %backend_running% equ 1 if %frontend_running% equ 1 (
    echo No InsPecPro services are currently running
    echo Ports 8000 and 3000 are free
    pause
    exit /b 0
)

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if errorlevel 1 (
    echo PowerShell not available, using basic stop method...
    echo.
    goto BASIC_STOP
)

echo Stopping with PowerShell (recommended)...
powershell -ExecutionPolicy Bypass -File "stop-all.ps1"
goto END

:BASIC_STOP
echo [Basic Mode] Stopping services...
echo.

REM Close named windows first (if they exist)
echo [1/5] Closing InsPecPro terminal windows...
taskkill /fi "WindowTitle eq InsPecPro Backend*" /f >nul 2>&1
taskkill /fi "WindowTitle eq InsPecPro Frontend*" /f >nul 2>&1

echo [2/5] Stopping Backend (port 8000)...
if %backend_running% equ 0 (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
        if not "%%a"=="" (
            echo   Killing backend process %%a
            taskkill /f /pid %%a >nul 2>&1
            if errorlevel 1 (
                echo   Warning: Could not kill process %%a
            ) else (
                echo   Backend process %%a stopped
            )
        )
    )
) else (
    echo   Backend not running on port 8000
)

echo [3/5] Stopping Frontend (port 3000)...
if %frontend_running% equ 0 (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
        if not "%%a"=="" (
            echo   Killing frontend process %%a
            taskkill /f /pid %%a >nul 2>&1
            if errorlevel 1 (
                echo   Warning: Could not kill process %%a
            ) else (
                echo   Frontend process %%a stopped
            )
        )
    )
) else (
    echo   Frontend not running on port 3000
)

echo [4/5] Stopping related Node.js processes...
tasklist | findstr node.exe >nul 2>&1
if not errorlevel 1 (
    echo   Stopping Node.js processes...
    taskkill /f /im node.exe >nul 2>&1
    if errorlevel 1 (
        echo   Warning: Some Node.js processes could not be stopped
    ) else (
        echo   Node.js processes stopped
    )
) else (
    echo   No Node.js processes found
)

tasklist | findstr npm.exe >nul 2>&1
if not errorlevel 1 (
    echo   Stopping npm processes...
    taskkill /f /im npm.exe >nul 2>&1
) else (
    echo   No npm processes found
)

echo [5/5] Stopping Python processes (InsPecPro related)...
REM More selective Python process killing
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq python.exe" /fo csv ^| findstr /v "PID"') do (
    set pid=%%a
    set pid=!pid:"=!
    if not "!pid!"=="" (
        echo   Checking Python process !pid!...
        tasklist /fi "pid eq !pid!" /fo csv | findstr "main.py\|uvicorn\|fastapi" >nul 2>&1
        if not errorlevel 1 (
            echo   Stopping InsPecPro Python process !pid!
            taskkill /f /pid !pid! >nul 2>&1
        )
    )
)

echo.
echo ========================================
echo    Verifying Services Stopped...
echo ========================================

REM Wait a moment for processes to fully terminate
timeout /t 2 /nobreak >nul

REM Check ports again
netstat -an | findstr :8000 >nul 2>&1
if errorlevel 1 (
    echo ✓ Port 8000 (Backend) is free
) else (
    echo ✗ Port 8000 (Backend) still in use
    echo   You may need to manually stop remaining processes
)

netstat -an | findstr :3000 >nul 2>&1
if errorlevel 1 (
    echo ✓ Port 3000 (Frontend) is free
) else (
    echo ✗ Port 3000 (Frontend) still in use
    echo   You may need to manually stop remaining processes
)

echo.
echo ========================================
echo    InsPecPro Services Stopped!
echo ========================================
echo.
echo All InsPecPro services have been stopped.
echo You can now run start.bat to restart the application.

:END
echo.
pause