@echo off
echo ========================================
echo    TaskBuilder Local APK Builder
echo ========================================
echo.
echo This script builds an APK locally on your machine.
echo.
echo REQUIREMENTS:
echo - Java JDK 17 (set JAVA_HOME)
echo - Android SDK (set ANDROID_HOME)
echo - Android Build Tools
echo.

:: Check Java
if "%JAVA_HOME%"=="" (
    echo [ERROR] JAVA_HOME is not set!
    echo Please install JDK 17 and set JAVA_HOME environment variable.
    echo Download from: https://adoptium.net/
    echo.
    pause
    exit /b 1
)

echo [OK] JAVA_HOME: %JAVA_HOME%

:: Check Android SDK
if "%ANDROID_HOME%"=="" (
    if "%ANDROID_SDK_ROOT%"=="" (
        echo [ERROR] ANDROID_HOME is not set!
        echo Please install Android Studio and set ANDROID_HOME.
        echo.
        pause
        exit /b 1
    ) else (
        set ANDROID_HOME=%ANDROID_SDK_ROOT%
    )
)

echo [OK] ANDROID_HOME: %ANDROID_HOME%
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
)

echo ========================================
echo    Generating Android Project
echo ========================================
echo.

:: Run prebuild to generate android folder
call npx expo prebuild --platform android --clean

if %errorlevel% neq 0 (
    echo [ERROR] Prebuild failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Building APK with Gradle
echo ========================================
echo.

cd android

:: Build release APK
call gradlew.bat assembleRelease

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Gradle build failed!
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo    Build Complete!
echo ========================================
echo.
echo Your APK is located at:
echo android\app\build\outputs\apk\release\app-release.apk
echo.

:: Copy APK to root folder with better name
if exist "android\app\build\outputs\apk\release\app-release.apk" (
    copy "android\app\build\outputs\apk\release\app-release.apk" "TaskBuilder.apk" >nul
    echo Copied to: TaskBuilder.apk
    echo.
)

echo Transfer this file to your Android device and install it.
echo.
echo NOTE: You may need to enable "Install from unknown sources"
echo in your Android settings.
echo.

pause
