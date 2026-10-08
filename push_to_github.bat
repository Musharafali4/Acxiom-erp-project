@echo off
set "PATH=%LOCALAPPDATA%\MinGit\cmd;%LOCALAPPDATA%\MinGit\bin;%PATH%"
echo ========================================================
echo   Pushing AcxiomCRM Platform to GitHub
echo   Repository: https://github.com/Musharafali4/Acxiom-erp-project
echo ========================================================
git push -u origin main
echo.
pause
