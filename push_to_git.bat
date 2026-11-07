@echo off
echo ========================================================
echo  GrocerEase - Pushing Changes to GitHub Repository
echo ========================================================
echo Remote: https://github.com/forgeindiaconnect-Techies/super-market-scan.git
echo Branch: main
echo.

cd /d "%~dp0"

echo 0. Ensuring 3D UI assets are copied to frontend/public and frontend/src/assets...
set "BRAIN_DIR=C:\Users\Forgeindiaconnect\.gemini\antigravity\brain\fb582fb9-2b2b-411c-ac43-40149f4c94a9"
set "FRONT_ASSETS=%~dp0frontend\src\assets"
set "FRONT_PUBLIC=%~dp0frontend\public"

if not exist "%FRONT_ASSETS%" mkdir "%FRONT_ASSETS%"
if not exist "%FRONT_PUBLIC%" mkdir "%FRONT_PUBLIC%"

if exist "%BRAIN_DIR%\sidebar_abstract_blue_waves_1794046512095.jpg" (
    copy /Y "%BRAIN_DIR%\sidebar_abstract_blue_waves_1794046512095.jpg" "%FRONT_ASSETS%\sidebar-waves-bg.jpg" >nul
    copy /Y "%BRAIN_DIR%\sidebar_abstract_blue_waves_1794046512095.jpg" "%FRONT_PUBLIC%\sidebar-waves-bg.jpg" >nul
)
if exist "%BRAIN_DIR%\grocery_basket_3d_1794046555765.jpg" (
    copy /Y "%BRAIN_DIR%\grocery_basket_3d_1794046555765.jpg" "%FRONT_ASSETS%\grocery-basket-3d.jpg" >nul
    copy /Y "%BRAIN_DIR%\grocery_basket_3d_1794046555765.jpg" "%FRONT_PUBLIC%\grocery-basket-3d.jpg" >nul
)
if exist "%BRAIN_DIR%\storefront_3d_supermarket_1794046532029.jpg" (
    copy /Y "%BRAIN_DIR%\storefront_3d_supermarket_1794046532029.jpg" "%FRONT_ASSETS%\storefront-3d.jpg" >nul
    copy /Y "%BRAIN_DIR%\storefront_3d_supermarket_1794046532029.jpg" "%FRONT_PUBLIC%\storefront-3d.jpg" >nul
)
if exist "%BRAIN_DIR%\dashboard_hero_banner_art_1794046675903.jpg" (
    copy /Y "%BRAIN_DIR%\dashboard_hero_banner_art_1794046675903.jpg" "%FRONT_ASSETS%\hero-banner-art.jpg" >nul
    copy /Y "%BRAIN_DIR%\dashboard_hero_banner_art_1794046675903.jpg" "%FRONT_PUBLIC%\hero-banner-art.jpg" >nul
)
if exist "%BRAIN_DIR%\dashboard_hero_fresh_cart_aisle_1794053392050.jpg" (
    copy /Y "%BRAIN_DIR%\dashboard_hero_fresh_cart_aisle_1794053392050.jpg" "%FRONT_ASSETS%\dashboard-hero-fresh-cart.jpg" >nul
    copy /Y "%BRAIN_DIR%\dashboard_hero_fresh_cart_aisle_1794053392050.jpg" "%FRONT_PUBLIC%\dashboard-hero-fresh-cart.jpg" >nul
    copy /Y "%BRAIN_DIR%\dashboard_hero_fresh_cart_aisle_1794053392050.jpg" "%FRONT_ASSETS%\hero-aisle-cart.jpg" >nul
    copy /Y "%BRAIN_DIR%\dashboard_hero_fresh_cart_aisle_1794053392050.jpg" "%FRONT_PUBLIC%\hero-aisle-cart.jpg" >nul
)
if exist "%BRAIN_DIR%\blue_shopping_bag_3d_1794053871902.jpg" (
    copy /Y "%BRAIN_DIR%\blue_shopping_bag_3d_1794053871902.jpg" "%FRONT_ASSETS%\blue-shopping-bag-3d.jpg" >nul
    copy /Y "%BRAIN_DIR%\blue_shopping_bag_3d_1794053871902.jpg" "%FRONT_PUBLIC%\blue-shopping-bag-3d.jpg" >nul
)
if exist "%BRAIN_DIR%\gift_box_3d_icon_1794053425724.jpg" (
    copy /Y "%BRAIN_DIR%\gift_box_3d_icon_1794053425724.jpg" "%FRONT_ASSETS%\gift-box-3d.jpg" >nul
    copy /Y "%BRAIN_DIR%\gift_box_3d_icon_1794053425724.jpg" "%FRONT_PUBLIC%\gift-box-3d.jpg" >nul
)

echo 1. Staging updated files...
git add -A

echo 2. Committing changes...
git commit -m "feat: exact UI/UX design matching reference image with 3D sidebar waves, 3D storefront, and panoramic supermarket hero banner, fixed receipt download modal"

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
