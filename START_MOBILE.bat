@echo off
chcp 65001 >nul
title GoBus Mobile Launcher
echo ========================================================
echo        تشغيل تطبيق الموبايل (GoBus Mobile - Expo)
echo ========================================================
echo.

echo [1/3] فحص قاعدة البيانات وسيرفر الباك ايند...
powershell -Command "Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue" >nul 2>&1
if %errorlevel% neq 0 (
    echo [تنبيه] خادم MongoDB غير مشغل، جاري إطلاقه تلقائياً...
    if exist "C:\Program Files\MongoDB\Server\9.0\bin\mongod.exe" (
        start "MongoDB Server" cmd /k "powershell -Command ""& 'C:\Program Files\MongoDB\Server\9.0\bin\mongod.exe' --dbpath '%~dp0mongodb_data' --port 27017 --bind_ip 127.0.0.1"""
        timeout /t 3 /nobreak >nul
    )
)

powershell -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue" >nul 2>&1
if %errorlevel% neq 0 (
    echo [تنبيه] سيرفر الباك ايند (NestJS) غير مشغل، جاري تشغيله تلقائياً...
    start "GoBus Backend (NestJS Port 3000)" cmd /k "cd /d %~dp0\Bus_Reservation && npm run start:prod"
    timeout /t 3 /nobreak >nul
) else (
    echo [OK] سيرفر الباك ايند يعمل بنجاح على المنفذ 3000.
)

echo.
echo [2/3] ضبط عنوان الشبكة المحلية (Wi-Fi IP) لتطبيق الموبايل...
node "%~dp0mobile_app\prepare_mobile_env.cjs"

echo.
echo ========================================================
echo [هام جداً]: تأكد أن هاتفك متصل بنفس شبكة الواي فاي (Wi-Fi)
echo ========================================================
echo.
echo [3/3] جاري تشغيل خادم Expo لمسح الرمز (QR Code)...
cd /d "%~dp0mobile_app"
npx expo start -c
pause
