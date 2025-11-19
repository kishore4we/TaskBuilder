@echo off
echo ========================================
echo    TaskBuilder App Setup
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Display Node.js version
echo [OK] Node.js found:
node --version
echo.

:: Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed!
    echo.
    pause
    exit /b 1
)

:: Display npm version
echo [OK] npm found:
npm --version
echo.

echo ========================================
echo    Installing Dependencies
echo ========================================
echo.

:: Install project dependencies
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies installed successfully!
echo.

echo ========================================
echo    Installing Expo CLI (Global)
echo ========================================
echo.

:: Install Expo CLI globally
call npm install -g expo-cli
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Could not install Expo CLI globally.
    echo You can still use npx expo commands.
)

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo To run the app:
echo.
echo   1. Start the development server:
echo      npm start
echo.
echo   2. Choose how to run:
echo      - Press 'a' for Android emulator
echo      - Press 'i' for iOS simulator (Mac only)
echo      - Press 'w' for web browser
echo      - Scan QR code with Expo Go app
echo.
echo   3. Download Expo Go on your phone:
echo      - Android: Play Store
echo      - iOS: App Store
echo.
echo NOTE: Add app icons to the 'assets' folder:
echo   - icon.png (1024x1024)
echo   - splash.png (1284x2778)
echo   - adaptive-icon.png (1024x1024)
echo.
echo ========================================
echo.

:: Ask if user wants to start the app now
set /p START_NOW="Do you want to start the app now? (y/n): "
if /i "%START_NOW%"=="y" (
    echo.
    echo Starting TaskBuilder...
    echo.
    call npm start
)

pause
