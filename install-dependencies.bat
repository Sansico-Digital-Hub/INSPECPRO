@echo off
echo ========================================
echo Installing InsPecPro Dependencies
echo ========================================

echo.
echo [1/3] Installing Backend Dependencies...
echo ----------------------------------------
cd backend
if exist requirements.txt (
    echo Installing Python dependencies...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Python dependencies
        pause
        exit /b 1
    )
    echo Backend dependencies installed successfully!
) else (
    echo WARNING: requirements.txt not found in backend directory
)

echo.
echo [2/3] Installing Frontend Dependencies...
echo ----------------------------------------
cd ..\frontend
if exist package.json (
    echo Installing Node.js dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Node.js dependencies
        pause
        exit /b 1
    )
    echo Frontend dependencies installed successfully!
) else (
    echo WARNING: package.json not found in frontend directory
)

echo.
echo [3/3] Installation Complete!
echo ========================================
echo All dependencies have been installed successfully.
echo You can now run start-all.bat to start the application.
echo ========================================

cd ..
pause