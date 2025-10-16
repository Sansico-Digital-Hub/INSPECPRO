@echo off
echo ========================================
echo    InsPecPro - Stop All Services
echo ========================================
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell not available
    echo Falling back to basic stop...
    echo.
    goto BASIC_STOP
)

echo Stopping with PowerShell (recommended)...
powershell -ExecutionPolicy Bypass -File "stop-all.ps1"
goto END

:BASIC_STOP
echo [Basic Mode] Stopping services...

echo Stopping Backend ^(port 8000^)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    if not "%%a"=="" (
        echo Killing process %%a
        taskkill /f /pid %%a >nul 2>&1
    )
)

echo Stopping Frontend ^(port 3000^)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    if not "%%a"=="" (
        echo Killing process %%a
        taskkill /f /pid %%a >nul 2>&1
    )
)

echo Stopping Node.js processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

echo Stopping Python processes...
taskkill /f /im python.exe >nul 2>&1

echo.
echo Verifying ports...
netstat -an | findstr :8000 >nul 2>&1
if errorlevel 1 (
    echo Port 8000 is free
) else (
    echo Port 8000 still in use
)

netstat -an | findstr :3000 >nul 2>&1
if errorlevel 1 (
    echo Port 3000 is free
) else (
    echo Port 3000 still in use
)

echo.
echo All services stopped!

:END
echo.
pause