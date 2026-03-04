@echo off
echo ========================================
echo Parkinson's Assessment App - Startup
echo ========================================
echo.

echo Starting Backend Server...
cd backend
call venv\Scripts\activate
start cmd /k "uvicorn main:app --reload"

timeout /t 3 /nobreak > nul

echo Starting Frontend Development Server...
cd ..\frontend
start cmd /k "npm run dev"

echo.
echo ========================================
echo Both servers are starting!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to exit this window...
pause > nul
