@echo off
setlocal enabledelayedexpansion

REM Set environment variables for proper path handling
set "GRADLE_USER_HOME=%USERPROFILE%\.gradle"
set "PUB_CACHE=%USERPROFILE%\.pub_cache"

REM Navigate to mobile_app directory
cd /d "%~dp0"

REM Run flutter with verbose output
flutter run -d V2312 --verbose

endlocal
pause
