Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " GrocerEase - Pushing Changes to GitHub Repository" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Remote: https://github.com/forgeindiaconnect-Techies/super-market-scan.git" -ForegroundColor Gray
Write-Host "Branch: main`n" -ForegroundColor Gray

Set-Location $PSScriptRoot

Write-Host "0. Ensuring 3D UI assets are copied to frontend/public and frontend/src/assets..." -ForegroundColor Yellow
$brainDir = "C:\Users\Forgeindiaconnect\.gemini\antigravity\brain\fb582fb9-2b2b-411c-ac43-40149f4c94a9"
$frontAssets = Join-Path $PSScriptRoot "frontend\src\assets"
$frontPublic = Join-Path $PSScriptRoot "frontend\public"

if (!(Test-Path $frontAssets)) { New-Item -ItemType Directory -Path $frontAssets -Force | Out-Null }
if (!(Test-Path $frontPublic)) { New-Item -ItemType Directory -Path $frontPublic -Force | Out-Null }

$assetMap = @{
    "sidebar_abstract_blue_waves_1794046512095.jpg" = "sidebar-waves-bg.jpg"
    "grocery_basket_3d_1794046555765.jpg" = "grocery-basket-3d.jpg"
    "storefront_3d_supermarket_1794046532029.jpg" = "storefront-3d.jpg"
    "dashboard_hero_banner_art_1794046675903.jpg" = "hero-banner-art.jpg"
    "dashboard_hero_fresh_cart_aisle_1794053392050.jpg" = "hero-aisle-cart.jpg"
    "blue_shopping_bag_3d_1794053871902.jpg" = "blue-shopping-bag-3d.jpg"
    "gift_box_3d_icon_1794053425724.jpg" = "gift-box-3d.jpg"
}

foreach ($key in $assetMap.Keys) {
    $src = Join-Path $brainDir $key
    $destName = $assetMap[$key]
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination (Join-Path $frontAssets $destName) -Force
        Copy-Item -Path $src -Destination (Join-Path $frontPublic $destName) -Force
        if ($destName -eq "hero-aisle-cart.jpg") {
            Copy-Item -Path $src -Destination (Join-Path $frontAssets "dashboard-hero-fresh-cart.jpg") -Force
            Copy-Item -Path $src -Destination (Join-Path $frontPublic "dashboard-hero-fresh-cart.jpg") -Force
        }
    }
}

Write-Host "1. Staging updated files..." -ForegroundColor Yellow
git add -A

Write-Host "2. Committing changes..." -ForegroundColor Yellow
git commit -m "feat: align Super Admin dashboard to reference UI, fix real-time customer price & discounts sync"

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
