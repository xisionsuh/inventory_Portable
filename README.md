# 재고 관리 시스템 (Inventory Management System)

윈도우 포터블 버전 재고 관리 프로그램

## 주요 기능

- 📊 실시간 재고 현황 대시보드
- 📥 입고/출고 관리
- 📤 엑셀 일괄 업로드/다운로드
- 🔍 제품 검색 및 필터링
- 📈 재고 통계 및 분석
- ⚠️ 재고 부족 알림
- 💰 총재고금액 계산

## 설치 및 실행 방법

### Windows에서 실행

1. 폴더를 원하는 위치에 복사
2. `start.bat` 더블클릭으로 실행
3. 브라우저에서 자동으로 열림 (http://localhost:3000)
4. 종료: `stop.bat` 실행

### 개발 모드 실행

```bash
# 백엔드 실행
cd backend
npm install
npm run dev

# 프론트엔드 실행
cd frontend
npm install
npm run dev
```

## 기술 스택

### Backend
- Node.js + Express
- TypeScript
- SQLite (better-sqlite3)
- XLSX (엑셀 처리)

### Frontend
- React + TypeScript
- Material-UI (MUI)
- Vite
- Context API

## 데이터베이스

SQLite 파일 기반 데이터베이스 사용
- 위치: `backend/data/inventory.db`
- 테이블: products, transactions

## 테스트 데이터 생성

```bash
cd backend
npm run seed              # 200개 제품 생성
npm run update-stock      # 재고 업데이트
```

## 엑셀 업로드 형식

재고 현황 내보내기 형식과 동일:
- 내부관리번호
- 제품고유번호 (필수)
- 제품명 (필수)
- 단위 (필수)
- 단가
- 최소재고량
- 현재재고량

## 라이선스

MIT
