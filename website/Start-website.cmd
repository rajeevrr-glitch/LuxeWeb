@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 24 LTS, then run this file again.
  pause
  exit /b 1
)
if not exist node_modules (
  set "NODE_OPTIONS=--use-system-ca"
  call npm.cmd ci --no-audit --no-fund
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Open http://127.0.0.1:3000 in your browser. Press Ctrl+C to stop.
call npm.cmd run dev
pause
