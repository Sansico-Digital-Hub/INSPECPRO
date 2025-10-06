@echo off
echo Starting InsPecPro System...
echo.

echo Starting Backend (FastAPI)...
cd backend
start "InsPecPro Backend" cmd /k "python main.py"
cd ..

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend (Next.js)...
cd frontend
start "InsPecPro Frontend" cmd /k "npm run dev"
cd ..

echo.
echo InsPecPro system is starting up!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul
