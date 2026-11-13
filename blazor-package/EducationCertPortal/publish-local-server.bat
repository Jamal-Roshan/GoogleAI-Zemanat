@echo off
chcp 65001 >nul
echo ========================================================
echo   انتشار و آماده‌سازی جهت میزبانی روی IIS یا سرور محلی
echo   پروژه Blazor .NET 10 - آموزش و پرورش ملایر
echo ========================================================

cd /d "%~dp0\EducationCertPortal"

echo در حال انتشار در پوشه publish...
dotnet publish EducationCertPortal.csproj -c Release -o ..\publish

if %errorlevel% equ 0 (
    echo.
    echo [موفقیت] فایل‌های آماده انتشار با موفقیت در پوشه publish ایجاد شدند!
    echo اکنون می‌توانید محتویات پوشه publish را به IIS یا سرور سازمانی منتقل نمایید.
) else (
    echo [خطا] فرآیند انتشار با خطا مواجه شد.
)

pause
