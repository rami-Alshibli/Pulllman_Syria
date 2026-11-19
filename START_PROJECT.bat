@echo off
chcp 65001 >nul
title GoBus Full Project Launcher
echo ========================================================
echo       تشغيل مشروع نظام حجز البولمان (GoBus)
echo ========================================================
echo.

echo [1/5] التحقق من تشغيل قاعدة بيانات MongoDB...
powershell -Command "Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue" >nul 2>&1
if %errorlevel% neq 0 (
    echo [تنبيه] MongoDB غير مشغل، جاري إطلاقه تلقائياً...
    if exist "C:\Program Files\MongoDB\Server\9.0\bin\mongod.exe" (
        start "MongoDB Server" cmd /k "powershell -Command ""& 'C:\Program Files\MongoDB\Server\9.0\bin\mongod.exe' --dbpath '%~dp0mongodb_data' --port 27017 --bind_ip 127.0.0.1"""
        timeout /t 3 /nobreak >nul
    ) else (
        echo يرجى التأكد من تشغيل خادم MongoDB على المنفذ 27017.
    )
) else (
    echo [OK] قاعدة بيانات MongoDB تعمل بالفعل على المنفذ 27017.
)

echo.
echo [2/5] تغذية قاعدة البيانات بالبيانات الافتراضية (Seeding)...
cd /d "%~dp0\frontend_web"
node seed_db.js

echo.
echo [3/5] ضبط عنوان الشبكة لربط تطبيق الموبايل تلقائياً...
node "%~dp0mobile_app\prepare_mobile_env.cjs"

echo.
echo [4/5] جاري تشغيل خادم الباك ايند (NestJS) على المنفذ 3000...
start "GoBus Backend (NestJS Port 3000)" cmd /k "cd /d %~dp0\Bus_Reservation && npm run start:prod"

echo.
echo [5/5] جاري تشغيل لوحة تحكم الفرونت ايند (Next.js) على المنفذ 3001...
start "GoBus Frontend (Next.js Port 3001)" cmd /k "cd /d %~dp0\frontend_web\client && npm run start"

echo.
echo ========================================================
echo تم إطلاق خوادم المشروع بنجاح!
echo لوحة التحكم الويب: http://localhost:3001/login
echo.
echo لتشغيل تطبيق الموبايل (Expo):
echo يمكنك تشغيل الملف START_MOBILE.bat أو START_MOBILE_WEB.bat
echo.
echo بيانات تسجيل الدخول:
echo - حساب المدير: ahmad_admin / password123
echo - حساب السكرتاريا: sara_sec / password123
echo - حساب الزبون (الموبايل): mohamed_ali / password123
echo ========================================================
pause
