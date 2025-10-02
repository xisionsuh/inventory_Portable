@echo off
echo Node.js 설치 확인 중...

:: Node.js 설치 확인
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ Node.js가 설치되어 있지 않습니다!
    echo.
    echo 📥 Node.js를 설치해주세요:
    echo    1. https://nodejs.org 방문
    echo    2. LTS 버전 다운로드 및 설치
    echo    3. 설치 후 이 스크립트를 다시 실행
    echo.
    pause
    exit /b 1
)

:: npm 설치 확인
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ npm이 설치되어 있지 않습니다!
    echo Node.js와 함께 npm이 설치되어야 합니다.
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js 및 npm이 설치되어 있습니다.
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo    Node.js: %NODE_VERSION%
echo    npm: %NPM_VERSION%
echo.
exit /b 0