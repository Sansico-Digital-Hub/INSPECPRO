# InsPecPro - Enhanced Unified Startup Script
param()

Write-Host "========================================"
Write-Host "   InsPecPro - Enhanced Startup"
Write-Host "   Backend + Frontend Management"
Write-Host "========================================"
Write-Host ""

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        return $connection -ne $null
    } catch {
        return $false
    }
}

# Function to wait for service to start
function Wait-ForService {
    param([int]$Port, [string]$ServiceName, [int]$TimeoutSeconds = 30)
    
    Write-Host "Waiting for $ServiceName to start on port $Port..."
    $elapsed = 0
    
    while ($elapsed -lt $TimeoutSeconds) {
        if (Test-Port -Port $Port) {
            Write-Host "✓ $ServiceName started successfully on port $Port" -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Host "." -NoNewline
    }
    
    Write-Host ""
    Write-Host "✗ $ServiceName failed to start within $TimeoutSeconds seconds" -ForegroundColor Red
    return $false
}

# Check if services are already running
Write-Host "Checking for existing services..."
if (Test-Port -Port 8000) {
    Write-Host "WARNING: Backend already running on port 8000" -ForegroundColor Yellow
    Write-Host "Use stop-all.ps1 first to stop existing services"
    Read-Host "Press Enter to exit"
    exit 1
}

if (Test-Port -Port 3000) {
    Write-Host "WARNING: Frontend already running on port 3000" -ForegroundColor Yellow
    Write-Host "Use stop-all.ps1 first to stop existing services"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Ports 8000 and 3000 are available" -ForegroundColor Green
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..."
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Python not found" -ForegroundColor Red
    Write-Host "Please install Python 3.8 or higher from https://www.python.org/downloads/"
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Node.js not found" -ForegroundColor Red
    Write-Host "Please install Node.js 16 or higher from https://nodejs.org/"
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    $npmVersion = npm --version 2>&1
    Write-Host "✓ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: npm not found" -ForegroundColor Red
    Write-Host "Please reinstall Node.js"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check .env file
if (-not (Test-Path "backend\.env")) {
    Write-Host "✗ WARNING: backend\.env file not found" -ForegroundColor Yellow
    Write-Host "Please create .env file from .env.example"
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✓ Environment configuration found" -ForegroundColor Green

Write-Host ""
Write-Host "Installing/updating dependencies..."

Write-Host "[1/2] Backend dependencies..."
Set-Location "backend"
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ERROR: Failed to install backend dependencies" -ForegroundColor Red
    Set-Location ".."
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green

Write-Host "[2/2] Frontend dependencies..."
Set-Location "..\frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ERROR: Failed to install frontend dependencies" -ForegroundColor Red
    Set-Location ".."
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green

Set-Location ".."
Write-Host ""
Write-Host "Starting services..."
# Start backend
Write-Host "[1/2] Starting Backend (FastAPI)..."
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\backend
    python main.py
}

# Wait for backend to start
if (Wait-ForService -Port 8000 -ServiceName "Backend" -TimeoutSeconds 15) {
    Write-Host "Backend API available at http://localhost:8000" -ForegroundColor Cyan
    Write-Host "API Documentation at http://localhost:8000/docs" -ForegroundColor Cyan
} else {
    Write-Host "Backend startup failed. Checking job output..." -ForegroundColor Red
    Receive-Job $backendJob
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[2/2] Starting Frontend (Next.js)..."
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\frontend
    npm run dev
}

# Wait for frontend to start
if (Wait-ForService -Port 3000 -ServiceName "Frontend" -TimeoutSeconds 20) {
    Write-Host "Frontend application available at http://localhost:3000" -ForegroundColor Cyan
} else {
    Write-Host "Frontend startup failed. Checking job output..." -ForegroundColor Red
    Receive-Job $frontendJob
    Write-Host "Stopping backend..." -ForegroundColor Yellow
    Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================"
Write-Host "   InsPecPro Services Running!"
Write-Host "========================================"
Write-Host "✓ Backend:  http://localhost:8000" -ForegroundColor Green
Write-Host "✓ Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "✓ API Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""

# Open browser
Write-Host "Opening application in browser..."
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Services are running in background jobs"
Write-Host "Press Ctrl+C to stop all services, or close this window"
Write-Host ""
Write-Host "Service Status Monitor:"
Write-Host "- Backend Job ID: $($backendJob.Id)"
Write-Host "- Frontend Job ID: $($frontendJob.Id)"
Write-Host ""

# Enhanced monitoring loop
try {
    $lastCheck = Get-Date
    $checkInterval = 10 # seconds
    
    while ($true) {
        Start-Sleep -Seconds 2
        
        # Check job status
        if ($backendJob.State -eq "Failed" -or $backendJob.State -eq "Stopped") {
            Write-Host ""
            Write-Host "✗ Backend job failed or stopped!" -ForegroundColor Red
            Write-Host "Backend job output:" -ForegroundColor Yellow
            Receive-Job $backendJob
            break
        }
        
        if ($frontendJob.State -eq "Failed" -or $frontendJob.State -eq "Stopped") {
            Write-Host ""
            Write-Host "✗ Frontend job failed or stopped!" -ForegroundColor Red
            Write-Host "Frontend job output:" -ForegroundColor Yellow
            Receive-Job $frontendJob
            break
        }
        
        # Periodic port check
        $currentTime = Get-Date
        if (($currentTime - $lastCheck).TotalSeconds -ge $checkInterval) {
            $backendRunning = Test-Port -Port 8000
            $frontendRunning = Test-Port -Port 3000
            
            if (-not $backendRunning) {
                Write-Host ""
                Write-Host "✗ Backend port 8000 is no longer responding!" -ForegroundColor Red
                break
            }
            
            if (-not $frontendRunning) {
                Write-Host ""
                Write-Host "✗ Frontend port 3000 is no longer responding!" -ForegroundColor Red
                break
            }
            
            # Show status indicator
            Write-Host "." -NoNewline -ForegroundColor Green
            $lastCheck = $currentTime
        }
    }
} catch {
    Write-Host ""
    Write-Host "Monitoring interrupted." -ForegroundColor Yellow
} finally {
    Write-Host ""
    Write-Host "Stopping services..." -ForegroundColor Yellow
    Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Write-Host "All services stopped" -ForegroundColor Green
    Write-Host ""
    Read-Host "Press Enter to exit"
}