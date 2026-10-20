@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Open Start-preview.cmd once to install the website dependencies first.
  pause
  exit /b 1
)
call npm.cmd run desk
pause
