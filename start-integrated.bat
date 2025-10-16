@echo off
echo ========================================
echo    InsPecPro - Integrated Startup
echo    Backend + Frontend in One Terminal
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo [1/4] Installing backend dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo [2/4] Installing frontend dependencies...
cd ..\frontend
npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo [3/4] Starting integrated services...
cd ..

REM Create PowerShell script to run both services
echo Write-Host "========================================" > start_services.ps1
echo Write-Host "   Starting Backend and Frontend" >> start_services.ps1
echo Write-Host "========================================" >> start_services.ps1
echo Write-Host "" >> start_services.ps1
echo Write-Host "Starting Backend (FastAPI)..." -ForegroundColor Green >> start_services.ps1
echo $backend = Start-Job -ScriptBlock { Set-Location "backend"; python main.py } >> start_services.ps1
echo Start-Sleep -Seconds 3 >> start_services.ps1
echo Write-Host "Starting Frontend (Next.js)..." -ForegroundColor Green >> start_services.ps1
echo $frontend = Start-Job -ScriptBlock { Set-Location "frontend"; npm run dev } >> start_services.ps1
echo Start-Sleep -Seconds 5 >> start_services.ps1
echo Write-Host "" >> start_services.ps1
echo Write-Host "========================================" -ForegroundColor Yellow >> start_services.ps1
echo Write-Host "   InsPecPro Services Running!" -ForegroundColor Yellow >> start_services.ps1
echo Write-Host "========================================" -ForegroundColor Yellow >> start_services.ps1
echo Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan >> start_services.ps1
echo Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan >> start_services.ps1
echo Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan >> start_services.ps1
echo Write-Host "" >> start_services.ps1
echo Write-Host "Opening browser..." -ForegroundColor Green >> start_services.ps1
echo Start-Process "http://localhost:3000" >> start_services.ps1
echo Write-Host "" >> start_services.ps1
echo Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Red >> start_services.ps1
echo Write-Host "Or close this window to stop services" -ForegroundColor Red >> start_services.ps1
echo Write-Host "" >> start_services.ps1
echo try { >> start_services.ps1
echo     while ($true) { >> start_services.ps1
echo         Start-Sleep -Seconds 1 >> start_services.ps1
echo         if ($backend.State -eq "Failed" -or $frontend.State -eq "Failed") { >> start_services.ps1
echo             Write-Host "One of the services failed!" -ForegroundColor Red >> start_services.ps1
echo             break >> start_services.ps1
echo         } >> start_services.ps1
echo     } >> start_services.ps1
echo } finally { >> start_services.ps1
echo     Write-Host "Stopping services..." -ForegroundColor Yellow >> start_services.ps1
echo     Stop-Job $backend, $frontend >> start_services.ps1
echo     Remove-Job $backend, $frontend >> start_services.ps1
echo     Write-Host "Services stopped." -ForegroundColor Green >> start_services.ps1
echo } >> start_services.ps1

echo [4/4] Launching integrated terminal...
echo.
echo ========================================
echo Starting PowerShell with both services
echo ========================================
echo.

REM Run PowerShell script
powershell -ExecutionPolicy Bypass -File start_services.ps1

REM Cleanup
del start_services.ps1 >nul 2>&1

echo.
echo Services have been stopped.
pause