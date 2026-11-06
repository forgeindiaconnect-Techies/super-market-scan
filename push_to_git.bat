@echo off
echo ========================================================
echo  GrocerEase - Pushing Changes to GitHub Repository
echo ========================================================
echo Remote: https://github.com/forgeindiaconnect-Techies/super-market-scan.git
echo Branch: main
echo.

cd /d "%~dp0"

echo 1. Staging updated files...
git add -A

echo 2. Committing changes...
git commit -m "feat: fix mobile receipt download, professional supermarket tax invoice, and complete UI/UX alignment"

echo 3. Ensuring main branch...
git branch -M main

echo 4. Pushing to origin main...
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  SUCCESS: Code pushed to GitHub successfully!
    echo ========================================================
) else (
    echo ========================================================
    echo  PUSH FAILED or requires authentication.
    echo  Please ensure you are logged into Git / GitHub CLI.
    echo ========================================================
)

pause
