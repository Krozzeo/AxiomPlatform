@echo off
setlocal
title Axiom Platform
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\Start-Axiom.ps1" %*
if errorlevel 1 (
  echo.
  echo Axiom could not start. Read the error above. This window will stay open.
  pause
)
endlocal
