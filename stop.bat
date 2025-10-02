@echo off
chcp 65001 >nul
echo ========================================
echo    재고관리 시스템 종료
echo ========================================
echo.

echo [작업] 실행 중인 Node.js 프로세스를 종료합니다...
taskkill /f /im node.exe 2>nul

if %errorlevel% equ 0 (
    echo [✓] 모든 서버가 종료되었습니다.
) else (
    echo [!] 실행 중인 프로세스가 없습니다.
)

echo.
echo ========================================
echo    종료 완료
echo ========================================
echo.
pause