# InsPecPro - Enhanced Stop All Services Script
param()

Write-Host "========================================"
Write-Host "   InsPecPro - Enhanced Stop Services"
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

# Function to kill processes on specific ports with better error handling
function Stop-ProcessOnPort {
    param([int]$Port, [string]$ServiceName)
    
    Write-Host "Checking $ServiceName on port $Port..."
    
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        
        if ($connections) {
            $processIds = $connections | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique
            
            foreach ($processId in $processIds) {
                try {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-Host "  Stopping $ServiceName process: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
                        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                        
                        # Wait a moment and verify
                        Start-Sleep -Seconds 1
                        $stillRunning = Get-Process -Id $processId -ErrorAction SilentlyContinue
                        if ($stillRunning) {
                            Write-Host "  Warning: Process $processId may still be running" -ForegroundColor Yellow
                        } else {
                            Write-Host "  ✓ $ServiceName process stopped successfully" -ForegroundColor Green
                        }
                    }
                } catch {
                    Write-Host "  Warning: Could not stop process $processId" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "  ✓ No $ServiceName process found on port $Port" -ForegroundColor Green
        }
    } catch {
        Write-Host "  Error: Could not check port $Port for $ServiceName" -ForegroundColor Red
    }
}

# Function to kill processes by name pattern with better filtering
function Stop-ProcessByName {
    param([string]$Pattern, [string]$ServiceName, [string[]]$ExcludePatterns = @())
    
    Write-Host "Checking $ServiceName processes..."
    
    try {
        $processes = Get-Process | Where-Object { 
            $_.ProcessName -like "*$Pattern*" -and
            ($ExcludePatterns.Count -eq 0 -or -not ($ExcludePatterns | Where-Object { $_.ProcessName -like "*$_*" }))
        }
        
        if ($processes) {
            foreach ($process in $processes) {
                try {
                    # Additional filtering for InsPecPro related processes
                    $commandLine = ""
                    try {
                        $commandLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($process.Id)").CommandLine
                    } catch {
                        # If we can't get command line, proceed with caution
                    }
                    
                    # Only stop if it's likely InsPecPro related
                    $isInsPecProRelated = $commandLine -match "main\.py|npm.*dev|uvicorn|fastapi" -or 
                                         $process.ProcessName -eq "python" -or 
                                         $process.ProcessName -eq "node"
                    
                    if ($isInsPecProRelated -or $Pattern -eq "python" -or $Pattern -eq "node") {
                        Write-Host "  Stopping $ServiceName: $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Yellow
                        if ($commandLine) {
                            Write-Host "    Command: $($commandLine.Substring(0, [Math]::Min(80, $commandLine.Length)))..." -ForegroundColor Gray
                        }
                        
                        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                        
                        # Verify
                        Start-Sleep -Seconds 1
                        $stillRunning = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
                        if ($stillRunning) {
                            Write-Host "    Warning: Process may still be running" -ForegroundColor Yellow
                        } else {
                            Write-Host "    ✓ Process stopped successfully" -ForegroundColor Green
                        }
                    }
                } catch {
                    Write-Host "  Warning: Could not stop $ServiceName process $($process.Id)" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "  ✓ No $ServiceName processes found" -ForegroundColor Green
        }
    } catch {
        Write-Host "  Error: Could not check $ServiceName processes" -ForegroundColor Red
    }
}

# Function to close terminal windows by title
function Close-TerminalWindows {
    param([string[]]$TitlePatterns)
    
    Write-Host "Closing terminal windows..."
    
    foreach ($pattern in $TitlePatterns) {
        try {
            $windows = Get-Process | Where-Object { $_.MainWindowTitle -like "*$pattern*" -and $_.ProcessName -eq "WindowsTerminal" }
            foreach ($window in $windows) {
                Write-Host "  Closing terminal: $($window.MainWindowTitle)" -ForegroundColor Yellow
                $window.CloseMainWindow()
            }
        } catch {
            # Ignore errors when closing windows
        }
    }
}

# Initial check
Write-Host "Performing initial service check..."
$backendRunning = Test-Port -Port 8000
$frontendRunning = Test-Port -Port 3000

if (-not $backendRunning -and -not $frontendRunning) {
    Write-Host "✓ No services detected on ports 8000 and 3000" -ForegroundColor Green
    Write-Host "✓ All services appear to be already stopped" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================"
    Write-Host "   Stop Services Complete"
    Write-Host "========================================"
    exit 0
}

Write-Host ""
Write-Host "Services detected. Proceeding with shutdown..."
Write-Host ""

# Stop services
Write-Host "1. Stopping Backend Service (Port 8000)..."
Stop-ProcessOnPort -Port 8000 -ServiceName "Backend"

Write-Host ""
Write-Host "2. Stopping Frontend Service (Port 3000)..."
Stop-ProcessOnPort -Port 3000 -ServiceName "Frontend"

Write-Host ""
Write-Host "3. Stopping remaining Python processes..."
Stop-ProcessByName -Pattern "python" -ServiceName "Python"

Write-Host ""
Write-Host "4. Stopping remaining Node.js processes..."
Stop-ProcessByName -Pattern "node" -ServiceName "Node.js"

Write-Host ""
Write-Host "5. Attempting to close InsPecPro terminal windows..."
Close-TerminalWindows -TitlePatterns @("InsPecPro", "Backend", "Frontend", "main.py", "npm run dev")

Write-Host ""
Write-Host "6. Final verification..."

# Enhanced verification with timeout
$maxAttempts = 10
$attempt = 0
$allStopped = $false

while ($attempt -lt $maxAttempts -and -not $allStopped) {
    $attempt++
    Write-Host "  Verification attempt $attempt/$maxAttempts..."
    
    $backendFree = -not (Test-Port -Port 8000)
    $frontendFree = -not (Test-Port -Port 3000)
    
    if ($backendFree -and $frontendFree) {
        $allStopped = $true
        Write-Host "  ✓ All ports are now free!" -ForegroundColor Green
    } else {
        if (-not $backendFree) {
            Write-Host "  ⚠ Port 8000 (Backend) still in use" -ForegroundColor Yellow
        }
        if (-not $frontendFree) {
            Write-Host "  ⚠ Port 3000 (Frontend) still in use" -ForegroundColor Yellow
        }
        
        if ($attempt -lt $maxAttempts) {
            Write-Host "  Waiting 2 seconds before next check..." -ForegroundColor Gray
            Start-Sleep -Seconds 2
        }
    }
}

Write-Host ""
Write-Host "========================================"
if ($allStopped) {
    Write-Host "   ✓ ALL SERVICES STOPPED SUCCESSFULLY" -ForegroundColor Green
    Write-Host "   ✓ Ports 8000 and 3000 are free" -ForegroundColor Green
} else {
    Write-Host "   ⚠ SOME SERVICES MAY STILL BE RUNNING" -ForegroundColor Yellow
    Write-Host "   You may need to manually check running processes" -ForegroundColor Yellow
}
Write-Host "========================================"
Write-Host ""

Read-Host "Press Enter to exit"