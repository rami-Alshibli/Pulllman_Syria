@echo off
chcp 65001 >nul
title تشغيل تطبيق GoBus على محاكي أندرويد ستوديو (Android Studio Emulator)
echo ======================================================================
echo    تشغيل تطبيق الموبايل على محاكي أندرويد (Android Studio AVD)
echo ======================================================================
echo.

:: 1. ضبط مسارات Android SDK
set "ANDROID_HOME=C:\Users\ASUS\AppData\Local\Android\Sdk"
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%"

:: 2. فحص قاعدة البيانات MongoDB
echo [1/4] فحص قاعدة البيانات وسيرفر الباك ايند...
powershell -Command "Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue" >nul 2>&1
if %errorlevel% neq 0 (
    echo [تنبيه] خادم MongoDB غير مشغل، جاري إطلاقه تلقائياً...
    if exist "C:\Program Files\MongoDB\Server\9.0\bin\mongod.exe" (
        start "MongoDB Server" cmd /k "powershell -Command ""& 'C:\Program Files\MongoDB\Server\9.0\bin\mongod.exe' --dbpath '%~dp0mongodb_data' --port 27017 --bind_ip 127.0.0.1"""
        timeout /t 3 /nobreak >nul
    )
)

:: 3. فحص سيرفر الباك ايند NestJS
powershell -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue" >nul 2>&1
if %errorlevel% neq 0 (
    echo [تنبيه] سيرفر الباك ايند غير مشغل، جاري تشغيله تلقائياً...
    start "GoBus Backend (NestJS Port 3000)" cmd /k "cd /d %~dp0\Bus_Reservation && npm run start:prod"
    timeout /t 3 /nobreak >nul
) else (
    echo [OK] سيرفر الباك ايند يعمل بنجاح على المنفذ 3000.
)

:: 4. فحص المحاكي (Emulator)
echo.
echo [2/4] فحص المحاكي أو الجهاز المتصل (ADB)...
adb devices | findstr /R "device$" >nul 2>&1
if %errorlevel% neq 0 (
    echo [تنبيه] لا يوجد محاكي مشغل حالياً. جاري تشغيل المحاكي (Pixel_10_Pro)...
    start "" "%ANDROID_HOME%\emulator\emulator.exe" -avd Pixel_10_Pro -no-snapshot-load
    echo في انتظار إقلاع المحاكي واستجابته (يرجى الانتظار بضع ثوانٍ)...
    adb wait-for-device
    timeout /t 5 /nobreak >nul
) else (
    echo [OK] تم العثور على محاكي/جهاز أندرويد متصل بنجاح!
)

:: 5. توجيه المنافذ لضمان وصول المحاكي للباك ايند
echo.
echo [3/4] ضبط ربط المنافذ للمحاكي (Reverse Port Forwarding)...
adb reverse tcp:3000 tcp:3000 >nul 2>&1
adb reverse tcp:8081 tcp:8081 >nul 2>&1

:: 6. تشغيل التطبيق على المحاكي عبر Expo
echo.
echo [4/4] جاري تشغيل تطبيق GoBus على المحاكي تلقائياً...
cd /d "%~dp0mobile_app"
npx expo start --android
pause
