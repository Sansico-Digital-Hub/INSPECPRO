@echo off
REM Quick Connection Test for InspecPro
REM Tests MySQL, Backend, and Frontend connections

echo.
echo ============================================================
echo   INSPECPRO QUICK CONNECTION TEST
echo ============================================================
echo.

echo [1/4] Testing MySQL Service...
sc query MySQL80 | find "RUNNING" >nul
if %errorlevel% equ 0 (
    echo   [OK] MySQL is running
) else (
    echo   [ERROR] MySQL is not running!
    echo   Please start MySQL service first.
    pause
    exit /b 1
)

echo.
echo [2/4] Testing Backend API...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Backend API is responding
) else (
    echo   [ERROR] Backend API is not responding!
    echo   Please start the backend server: cd backend ^&^& python main.py
    pause
    exit /b 1
)

echo.
echo [3/4] Testing Frontend Server...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Frontend is responding
) else (
    echo   [ERROR] Frontend is not responding!
    echo   Please start the frontend server: cd frontend ^&^& npm run dev
    pause
    exit /b 1
)

echo.
echo [4/4] Running Python E2E Test...
python test_e2e_connection.py
if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo   ALL TESTS PASSED - SYSTEM IS READY!
    echo ============================================================
    echo.
    echo   Frontend: http://localhost:3000
    echo   Backend:  http://localhost:8000
    echo   API Docs: http://localhost:8000/docs
    echo.
) else (
    echo.
    echo   [ERROR] Some tests failed. Check output above.
    pause
    exit /b 1
)

pause
