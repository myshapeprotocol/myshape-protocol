@echo off
echo ========================================
echo   MyShape Matrix Dashboard Updater
echo ========================================
cd /d "%~dp0"

echo.
echo [0/4] Signaling RUNNING status...
echo {"status":"running","started":"%date% %time%"} > "..\..\public\matrix-status.json"
cd /d "..\..\"
git add public/matrix-status.json
git commit -m "chore: matrix status -> RUNNING" --no-verify
git push origin master
cd /d "%~dp0"
echo Status pushed. Dashboard will show "Updating..."

echo.
echo [1/4] Running cruise.js (this takes a few minutes)...
echo.
node cruise.js
if %errorlevel% neq 0 (
    echo ERROR: cruise.js failed!
    cd /d "..\..\"
    echo {"status":"error","finished":"%date% %time%"} > public\matrix-status.json
    git add public/matrix-status.json
    git commit -m "chore: matrix status -> ERROR" --no-verify
    git push origin master
    pause
    exit /b %errorlevel%
)
echo.
echo [2/4] Copying dashboard + updating status...
copy /Y matrix_dashboard.html "..\..\public\cmd.html"
echo {"status":"idle","updated":"%date% %time%"} > "..\..\public\matrix-status.json"
echo.
echo [3/4] Pushing to GitHub...
cd /d "..\..\"
git add public/cmd.html public/matrix-status.json
git commit -m "chore: update matrix dashboard %date% %time%" --no-verify
git push origin master
echo.
echo ========================================
echo   Done! Dashboard: myshape.com/cmd.html
echo   Status: myshape.com/matrix-status.json
echo ========================================
pause
