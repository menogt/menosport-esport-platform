@echo off
cd /d "%~dp0"
echo ==========================================
echo Esports Tournament Platform - Dev Server
echo ==========================================
echo.
echo Installing dependencies...
call npm install
if errorlevel 1 (
  echo.
  echo npm install failed. Make sure Node.js LTS is installed.
  pause
  exit /b 1
)
echo.
echo Starting Vite dev server...
echo When you see the Local URL, open it in your browser.
echo.
call npm run dev
pause
