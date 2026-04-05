@echo off
echo ==============================================
echo   Starting CodeSculptor Frontend and Backend
echo ==============================================

echo [1/2] Starting Backend Server (Flask)...
start "CodeSculptor Backend" cmd /k "cd /d "%~dp0backend" && pip install -r requirements.txt && python app.py"

echo [2/2] Starting Frontend Server...
start "CodeSculptor Frontend" cmd /k "cd /d "%~dp0frontend" && python -m http.server 8000"

echo.
echo Both servers have been launched in separate windows!
echo The backend will run on http://localhost:5000
echo The frontend will be available at http://localhost:8000
echo.
echo Please open a browser and go to http://localhost:8000 to see your application.
pause
