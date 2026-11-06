Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " GrocerEase - Pushing Changes to GitHub Repository" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Remote: https://github.com/forgeindiaconnect-Techies/super-market-scan.git" -ForegroundColor Gray
Write-Host "Branch: main`n" -ForegroundColor Gray

Set-Location $PSScriptRoot

Write-Host "1. Staging updated files..." -ForegroundColor Yellow
git add -A

Write-Host "2. Committing changes..." -ForegroundColor Yellow
git commit -m "feat: fix mobile receipt download, professional supermarket tax invoice, and complete UI/UX alignment"

Write-Host "3. Ensuring branch is main..." -ForegroundColor Yellow
git branch -M main

Write-Host "4. Pushing to origin main..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================================" -ForegroundColor Green
    Write-Host " SUCCESS: Code pushed to GitHub successfully!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
} else {
    Write-Host "`n========================================================" -ForegroundColor Red
    Write-Host " PUSH FAILED or requires authentication." -ForegroundColor Red
    Write-Host " Please verify your GitHub credentials or run 'gh auth login'." -ForegroundColor Red
    Write-Host "========================================================" -ForegroundColor Red
}
