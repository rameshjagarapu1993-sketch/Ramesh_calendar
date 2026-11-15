@echo off
REM Ramesh J booking calendar - install, test and start locally.
REM Double-click this file. A browser opens at http://localhost:3000 when ready.
cd /d "%~dp0"
title Ramesh J Booking - local run

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js is not installed. Download the LTS version from https://nodejs.org , install it, then run this file again.
  pause
  exit /b 1
)

echo.
echo ===== 1/4  Installing packages (first time takes 1-3 minutes) =====
call npm install
if errorlevel 1 ( echo. & echo  npm install FAILED - see the messages above. & pause & exit /b 1 )

echo.
echo ===== 2/4  Website tests (slots, time zones, calendar links) =====
call npm test
if errorlevel 1 ( echo. & echo  Website tests FAILED - see above. & pause & exit /b 1 )

echo.
echo ===== 3/4  Backend tests (booking, double-booking, emails, reminders) =====
call npm run test:backend
if errorlevel 1 ( echo. & echo  Backend tests FAILED - see above. & pause & exit /b 1 )

echo.
echo ===== 4/4  Starting the site at http://localhost:3000  (close this window to stop) =====
start "" cmd /c "timeout /t 4 >nul & start http://localhost:3000"
call npm run dev
pause
