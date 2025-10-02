@echo off
chcp 65001 >nul
echo ========================================
echo    재고관리 시스템 포터블 버전 시작
echo ========================================
echo.

REM Node.js 확인
call scripts\check-nodejs.bat
if %errorlevel% neq 0 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo.
    echo Node.js를 설치해주세요:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [✓] Node.js 확인 완료
echo.

REM 백엔드 의존성 확인
if not exist backend\node_modules (
    echo [!] 백엔드 패키지가 설치되어 있지 않습니다.
    echo [작업] 패키지를 설치합니다...
    cd backend
    call npm install
    if %errorlevel% neq 0 (
        echo [오류] 백엔드 패키지 설치 실패
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [✓] 백엔드 패키지 설치 완료
)

REM 프론트엔드 의존성 확인
if not exist frontend\node_modules (
    echo [!] 프론트엔드 패키지가 설치되어 있지 않습니다.
    echo [작업] 패키지를 설치합니다...
    cd frontend
    call npm install
    if %errorlevel% neq 0 (
        echo [오류] 프론트엔드 패키지 설치 실패
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [✓] 프론트엔드 패키지 설치 완료
)

echo.
echo ========================================
echo    서버를 시작합니다...
echo ========================================
echo.

REM 백엔드 서버 시작 (백그라운드)
echo [작업] 백엔드 서버 시작 중...
cd backend
start "재고관리 백엔드" cmd /k "npm start"
cd ..
echo [✓] 백엔드 서버가 시작되었습니다 (포트: 5000)
echo.

REM 서버 시작 대기
echo [대기] 백엔드 서버 초기화 중... (5초)
timeout /t 5 /nobreak >nul

REM 프론트엔드 서버 시작
echo [작업] 프론트엔드 서버 시작 중...
cd frontend
start "재고관리 프론트엔드" cmd /k "npm run dev"
cd ..
echo [✓] 프론트엔드 서버가 시작되었습니다 (포트: 5173)
echo.

REM 브라우저 대기 및 실행
echo [대기] 프론트엔드 서버 초기화 중... (3초)
timeout /t 3 /nobreak >nul

echo [실행] 브라우저를 엽니다...
start http://localhost:5173

echo.
echo ========================================
echo    시스템이 실행 중입니다!
echo ========================================
echo.
echo 📱 웹 주소: http://localhost:5173
echo 🔧 API 주소: http://localhost:5000/api/health
echo.
echo ⚠️  서버를 종료하려면 stop.bat를 실행하세요.
echo    또는 각 터미널 창에서 Ctrl+C를 누르세요.
echo.
pause
