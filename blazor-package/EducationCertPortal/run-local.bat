@echo off
chcp 65001 >nul
echo ========================================================
echo   سامانه صدور و استعلام اسناد - مدیریت آموزش و پرورش ملایر
echo   در حال اجرای پروژه Blazor .NET 10 روی سرور محلی...
echo ========================================================

cd /d "%~dp0\EducationCertPortal"

echo بررسی نصب دات نت...
dotnet --version
if %errorlevel% neq 0 (
    echo [خطا] دات نت 10 یا 9 روی سیستم شما یافت نشد!
    echo لطفاً .NET SDK را از آدرس https://dotnet.microsoft.com/download نصب فرمایید.
    pause
    exit /b
)

echo در حال کامپایل و اجرای سامانه...
echo سامانه روی پورت 5000 در دسترس خواهد بود: http://localhost:5000
dotnet run

pause
