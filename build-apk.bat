@echo off
echo ========================================
echo    TaskBuilder APK Builder
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

echo [OK] Node.js and npm found
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
)

:: Install eas-cli locally as dev dependency
echo [INFO] Installing EAS CLI locally...
call npm install --save-dev eas-cli
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install EAS CLI!
    pause
    exit /b 1
)

echo [OK] EAS CLI ready
echo.

echo ========================================
echo    Building TaskBuilder.apk
echo ========================================
echo.
echo This will build an APK file using Expo's cloud build service.
echo You will need an Expo account (free).
echo.
echo If you don't have an account, one will be created during the process.
echo.

:: Check if user is logged in
call npx eas whoami >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Please log in to your Expo account:
    echo.
    call npx eas login
    if %errorlevel% neq 0 (
        echo [ERROR] Login failed!
        pause
        exit /b 1
    )
    echo.
)

echo [OK] Logged in to Expo
echo.

:: Start the build
echo Starting APK build...
echo This may take 10-20 minutes. The APK will be built in the cloud.
echo.

call npx eas build --platform android --profile preview

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed!
    echo.
    echo Common issues:
    echo - Missing app icons in assets folder
    echo - Network connection problems
    echo - Invalid app.json configuration
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Build Complete!
echo ========================================
echo.
echo Your APK has been built successfully!
echo.
echo To download your APK:
echo 1. Check the link shown above, OR
echo 2. Go to https://expo.dev and find your build
echo 3. Download the APK file
echo 4. Transfer to your Android device and install
echo.
echo NOTE: You may need to enable "Install from unknown sources"
echo in your Android settings to install the APK.
echo.
echo ========================================
echo.

pause
