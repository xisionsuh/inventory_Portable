# 🎯 재고 관리 시스템 - 포터블 버전

## 📦 Windows PC 간 이동 가능한 버전

이 폴더를 다른 Windows PC로 복사만 하면 바로 사용할 수 있습니다!

---

## 🚀 빠른 시작 (3단계)

### 1️⃣ Node.js 설치 확인
- Node.js가 설치되어 있지 않다면 https://nodejs.org/ 에서 다운로드
- 설치 후 컴퓨터 재시작 권장

### 2️⃣ 프로그램 실행
```
QUICK_START.bat 더블클릭
```
또는
```
start.bat 더블클릭
```

### 3️⃣ 브라우저 접속
- 자동으로 브라우저가 열립니다
- 또는 수동으로 http://localhost:5173 접속

---

## 📂 폴더 구조

```
inventory_portable/
├── 📄 QUICK_START.bat      ⭐ 이것을 더블클릭하세요!
├── 📄 start.bat             실행 스크립트
├── 📄 stop.bat              종료 스크립트
├── 📄 install.bat           수동 설치 스크립트
├── 📁 backend/              백엔드 서버
│   ├── 📁 src/             소스 코드
│   ├── 📁 dist/            컴파일된 파일
│   ├── 📁 data/            데이터베이스
│   └── 📁 node_modules/    백엔드 패키지
├── 📁 frontend/             프론트엔드
│   ├── 📁 src/             소스 코드
│   ├── 📁 dist/            빌드된 파일
│   └── 📁 node_modules/    프론트엔드 패키지
├── 📁 scripts/              유틸리티 스크립트
└── 📄 README_PORTABLE.md   이 파일
```

---

## 💻 시스템 요구사항

- ✅ Windows 7/10/11
- ✅ Node.js 16.x 이상
- ✅ 최소 2GB RAM
- ✅ 최소 1GB 디스크 공간
- ✅ 인터넷 연결 (초기 패키지 설치시)

---

## 🔧 사용 방법

### ⚡ 자동 실행 (권장)
```
QUICK_START.bat 더블클릭
```
모든 설정을 자동으로 처리합니다!

### 🔨 수동 실행
1. `install.bat` - 패키지 설치 (최초 1회)
2. `start.bat` - 서버 시작
3. 브라우저에서 http://localhost:5173 접속

### 🛑 종료 방법
```
stop.bat 더블클릭
```
또는 각 터미널 창에서 `Ctrl + C`

---

## 📦 다른 PC로 이동하기

### 방법 1: USB/외장 드라이브
1. 전체 폴더를 USB에 복사
2. 다른 PC에 붙여넣기
3. `QUICK_START.bat` 실행

### 방법 2: 네트워크/클라우드
1. 폴더를 ZIP으로 압축
2. 클라우드 드라이브/이메일로 전송
3. 다른 PC에서 압축 해제
4. `QUICK_START.bat` 실행

---

## 🌐 네트워크에서 접속하기

### 같은 네트워크의 다른 기기에서 접속
1. 서버 PC의 IP 주소 확인
   ```cmd
   ipconfig
   ```
2. 다른 기기에서 접속
   ```
   http://[서버PC의IP]:5173
   ```
   예: http://192.168.0.10:5173

3. ⚠️ 방화벽 허용 필요
   - Windows 방화벽에서 포트 5000, 5173 허용
   - 또는 방화벽 일시 해제

---

## 💾 데이터 백업

### 자동 백업 위치
```
backend/data/inventory.db
```

### 수동 백업
```cmd
copy backend\data\inventory.db backup\inventory_backup_%date%.db
```

### 복원
```cmd
copy backup\inventory_backup_YYYYMMDD.db backend\data\inventory.db
```

---

## 🐛 문제 해결

### ❌ "node는 내부 또는 외부 명령이 아닙니다"
**원인:** Node.js가 설치되지 않음
**해결:** https://nodejs.org/ 에서 Node.js 설치 후 재시작

### ❌ "포트가 이미 사용 중입니다"
**원인:** 이미 다른 프로그램이 포트 사용 중
**해결:** `stop.bat` 실행 또는 작업 관리자에서 `node.exe` 종료

### ❌ "패키지 설치 실패"
**원인:** 인터넷 연결 문제
**해결:** 인터넷 연결 확인 후 `install.bat` 재실행

### ❌ 브라우저에서 "연결할 수 없음"
**원인:** 서버가 시작되지 않음
**해결:**
1. 터미널 창에서 에러 메시지 확인
2. `stop.bat` 실행
3. `start.bat` 재실행

### ❌ 다른 기기에서 접속 안됨
**원인:** 방화벽 차단
**해결:**
1. Windows 방화벽에서 포트 5000, 5173 허용
2. 또는 "Windows Defender 방화벽" 일시 해제

---

## 📞 추가 도움말

### 설정 검증
```cmd
scripts\verify-setup.bat
```

### 로그 확인
- 백엔드: 백엔드 터미널 창
- 프론트엔드: 프론트엔드 터미널 창
- 브라우저: F12 → Console 탭

---

## ⚙️ 고급 설정

### 포트 변경
- **백엔드:** `backend/src/server.ts` 의 `PORT` 변수
- **프론트엔드:** `frontend/vite.config.ts` 의 `port` 설정

### 데이터베이스 초기화
```cmd
del backend\data\inventory.db
```
그 후 `start.bat` 재실행

---

## 📝 버전 정보

- **버전:** 1.0.0 Portable
- **업데이트:** 2025-10-02
- **라이선스:** MIT

---

## ✨ 특징

✅ **설치 불필요** - 폴더 복사만으로 실행
✅ **독립 실행** - 모든 파일이 하나의 폴더에
✅ **이동 가능** - USB, 네트워크로 자유롭게 이동
✅ **자동 설정** - 한 번의 클릭으로 모든 설정
✅ **데이터 보존** - 이동해도 데이터 유지

---

**🎉 준비 완료! QUICK_START.bat를 실행하세요!**
