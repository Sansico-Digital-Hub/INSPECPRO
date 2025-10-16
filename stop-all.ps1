# InsPecPro - Stop All Services Script
param()

Write-Host "========================================"
Write-Host "   InsPecPro - Stop All Services"
Write-Host "========================================"
Write-Host ""

# Function to kill processes on specific ports
function Stop-ProcessOnPort {
    param([int]$Port, [string]$ServiceName)
    
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                    Select-Object -ExpandProperty OwningProcess | 
                    Sort-Object -Unique
        
        if ($processes) {
            foreach ($processId in $processes) {
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "Stopping $ServiceName (PID: $processId)"
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    Write-Host "$ServiceName stopped"
                }
            }
        } else {
            Write-Host "No $ServiceName process found on port $Port"
        }
    } catch {
        Write-Host "Could not check port $Port for $ServiceName"
    }
}

# Function to kill processes by name pattern
function Stop-ProcessByName {
    param([string]$Pattern, [string]$ServiceName)
    
    try {
        $processes = Get-Process | Where-Object { $_.ProcessName -like "*$Pattern*" }
        
        if ($processes) {
            foreach ($process in $processes) {
                Write-Host "Stopping $ServiceName (PID: $($process.Id))"
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                Write-Host "$ServiceName process stopped"
            }
        } else {
            Write-Host "No $ServiceName processes found"
        }
    } catch {
        Write-Host "Could not find $ServiceName processes"
    }
}

Write-Host "[1/4] Stopping Backend (FastAPI on port 8000)..."
Stop-ProcessOnPort -Port 8000 -ServiceName "Backend"

Write-Host ""
Write-Host "[2/4] Stopping Frontend (Next.js on port 3000)..."
Stop-ProcessOnPort -Port 3000 -ServiceName "Frontend"

Write-Host ""
Write-Host "[3/4] Stopping Python processes..."
Stop-ProcessByName -Pattern "python" -ServiceName "Python"

Write-Host ""
Write-Host "[4/4] Stopping Node.js processes..."
Stop-ProcessByName -Pattern "node" -ServiceName "Node.js"

Write-Host ""
Write-Host "========================================"
Write-Host "   Verifying Ports..."
Write-Host "========================================"

# Check if ports are free
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port8000) {
    Write-Host "Port 8000 still in use"
} else {
    Write-Host "Port 8000 is free"
}

if ($port3000) {
    Write-Host "Port 3000 still in use"
} else {
    Write-Host "Port 3000 is free"
}

Write-Host ""
Write-Host "========================================"
Write-Host "   All InsPecPro services stopped!"
Write-Host "========================================"
Write-Host ""

Read-Host "Press Enter to exit"