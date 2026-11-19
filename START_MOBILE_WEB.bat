@echo off
chcp 65001 >nul
echo ========================================================
echo   تشغيل تطبيق الموبايل كنسخة ويب (Expo Web Preview)
echo ========================================================
echo.
cd /d "%~dp0mobile_app"
npx expo start --web
pause
