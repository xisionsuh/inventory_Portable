@echo off
echo ========================================
echo    포터블 버전 설정 검증
echo ========================================
echo.

REM Node.js 확인
echo [1/5] Node.js 설치 확인...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js가 설치되어 있지 않습니다.
    echo    https://nodejs.org 에서 다운로드하세요.
    goto :error
) else (
    echo ✅ Node.js 설치됨
    node --version
)

REM npm 확인
echo.
echo [2/5] npm 설치 확인...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm이 설치되어 있지 않습니다.
    goto :error
) else (
    echo ✅ npm 설치됨
    npm --version
)

REM 백엔드 의존성 확인
echo.
echo [3/5] 백엔드 의존성 확인...
if exist "backend\node_modules" (
    echo ✅ 백엔드 의존성 설치됨
) else (
    echo ❌ 백엔드 의존성이 설치되지 않았습니다.
    echo    install.bat를 실행하세요.
    goto :error
)

REM 프론트엔드 의존성 확인
echo.
echo [4/5] 프론트엔드 의존성 확인...
if exist "frontend\node_modules" (
    echo ✅ 프론트엔드 의존성 설치됨
) else (
    echo ❌ 프론트엔드 의존성이 설치되지 않았습니다.
    echo    install.bat를 실행하세요.
    goto :error
)

REM 포트 사용 가능 여부 확인
echo.
echo [5/5] 포트 사용 가능 여부 확인...
netstat -an | find ":3001" >nul
if %errorlevel% equ 0 (
    echo ⚠️  포트 3001이 이미 사용 중입니다.
    echo    stop.bat를 실행하거나 다른 프로그램을 종료하세요.
) else (
    echo ✅ 포트 3001 사용 가능
)

netstat -an | find ":5173" >nul
if %errorlevel% equ 0 (
    echo ⚠️  포트 5173이 이미 사용 중입니다.
    echo    stop.bat를 실행하거나 다른 프로그램을 종료하세요.
) else (
    echo ✅ 포트 5173 사용 가능
)

echo.
echo ========================================
echo ✅ 모든 검증이 완료되었습니다!
echo    start.bat를 실행하여 시스템을 시작하세요.
echo ========================================
goto :end

:error
echo.
echo ========================================
echo ❌ 설정에 문제가 있습니다.
echo    위의 오류를 해결한 후 다시 시도하세요.
echo ========================================

:end
echo.
pause