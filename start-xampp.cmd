@echo off
:: ============================================
:: Athena Library System - XAMPP Quick Start
:: ============================================
echo.
echo  ======================================
echo   Athena Library System - XAMPP Setup
echo  ======================================
echo.

:: 1. Check XAMPP Apache is running
echo [1/3] Checking XAMPP Apache...
tasklist /FI "IMAGENAME eq httpd.exe" 2>NUL | find /I /N "httpd.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo       Apache is running. OK.
) else (
    echo       Apache is NOT running. Please start XAMPP Apache first.
    pause
    exit /b 1
)

:: 2. Check XAMPP MySQL is running
echo [2/3] Checking XAMPP MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo       MySQL is running. OK.
) else (
    echo       MySQL is NOT running. Please start XAMPP MySQL first.
    pause
    exit /b 1
)

:: 3. Open app in browser
echo [3/3] Opening Athena in browser...
start http://localhost/athen-/dist/

echo.
echo  App URL:     http://localhost/athen-/dist/
echo  API URL:     http://localhost/athen-/api/
echo  phpMyAdmin:  http://localhost/phpmyadmin/
echo.
echo  ======================================
echo   Admin Login Credentials
echo  ======================================
echo   Email:    stuartdonsms@gmail.com
echo   Password: admin123!
echo.
echo   (or)
echo.
echo   Email:    code5_library
echo   Password: admin123!
echo  ======================================
echo.
pause
