# InsPecPro - Unified Startup Script
param()

Write-Host "========================================"
Write-Host "   InsPecPro - Unified Startup"
Write-Host "   Backend + Frontend in One Terminal"
Write-Host "========================================"
Write-Host ""

# Check Python
try {
    $pythonCheck = python --version 2>&1
    Write-Host "Python found: $pythonCheck"
} catch {
    Write-Host "ERROR: Python not found"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Node.js
try {
    $nodeCheck = node --version 2>&1
    Write-Host "Node.js found: $nodeCheck"
} catch {
    Write-Host "ERROR: Node.js not found"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[1/3] Installing backend dependencies..."
Set-Location "backend"
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install backend dependencies"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[2/3] Installing frontend dependencies..."
Set-Location "..\frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install frontend dependencies"
    Read-Host "Press Enter to exit"
    exit 1
}

Set-Location ".."
Write-Host "[3/3] Starting services..."
Write-Host ""

# Start backend
Write-Host "Starting Backend..."
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\backend
    python main.py
}

Start-Sleep -Seconds 3
Write-Host "Backend started on http://localhost:8000"

# Start frontend
Write-Host "Starting Frontend..."
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\frontend
    npm run dev
}

Start-Sleep -Seconds 5
Write-Host "Frontend started on http://localhost:3000"

Write-Host ""
Write-Host "========================================"
Write-Host "   InsPecPro Services Running!"
Write-Host "========================================"
Write-Host "Backend:  http://localhost:8000"
Write-Host "Frontend: http://localhost:3000"
Write-Host "API Docs: http://localhost:8000/docs"
Write-Host ""

# Open browser
Start-Process "http://localhost:3000"

Write-Host "Services are running in background"
Write-Host "Press Ctrl+C to stop all services"
Write-Host ""

# Keep running and monitor
try {
    while ($true) {
        Start-Sleep -Seconds 5
        
        if ($backendJob.State -eq "Failed") {
            Write-Host "Backend job failed!"
            Receive-Job $backendJob
            break
        }
        
        if ($frontendJob.State -eq "Failed") {
            Write-Host "Frontend job failed!"
            Receive-Job $frontendJob
            break
        }
    }
} finally {
    Write-Host "Stopping services..."
    Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Write-Host "All services stopped"
    Read-Host "Press Enter to exit"
}