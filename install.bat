@echo off
echo ========================================
echo    재고관리 시스템 포터블 버전 설치
echo ========================================
echo.

REM Node.js 확인
call scripts\check-nodejs.bat
if %errorlevel% neq 0 (
    echo [오류] Node.js 확인에 실패했습니다.
    pause
    exit /b 1
)

echo Node.js가 설치되어 있습니다.
echo.

REM 백엔드 의존성 설치
echo ========================================
echo 백엔드 의존성을 설치하는 중...
echo ========================================
cd backend
if not exist node_modules (
    echo 백엔드 패키지를 설치합니다...
    npm install
    if %errorlevel% neq 0 (
        echo [오류] 백엔드 의존성 설치에 실패했습니다.
        pause
        exit /b 1
    )
) else (
    echo 백엔드 패키지가 이미 설치되어 있습니다.
)
cd ..

REM 프론트엔드 의존성 설치
echo ========================================
echo 프론트엔드 의존성을 설치하는 중...
echo ========================================
cd frontend
if not exist node_modules (
    echo 프론트엔드 패키지를 설치합니다...
    npm install
    if %errorlevel% neq 0 (
        echo [오류] 프론트엔드 의존성 설치에 실패했습니다.
        pause
        exit /b 1
    )
) else (
    echo 프론트엔드 패키지가 이미 설치되어 있습니다.
)
cd ..

echo.
echo ========================================
echo 설치가 완료되었습니다!
echo start.bat 파일을 실행하여 시스템을 시작하세요.
echo ========================================
echo.
pause