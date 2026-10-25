@echo off
cd /d "%~dp0"
set "NODE_OPTIONS=--use-system-ca"
if not exist node_modules (
  call npm.cmd ci
  if errorlevel 1 exit /b 1
)
call npm.cmd run build
if errorlevel 1 exit /b 1
set "HOST=127.0.0.1"
set "INDEXABLE=false"
echo Open http://127.0.0.1:3000 to review the public release.
call npm.cmd start
pause
