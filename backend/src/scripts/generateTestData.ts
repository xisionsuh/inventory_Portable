import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(__dirname, '../../data/inventory.db');
const db = new Database(dbPath);

// 스키마 파일 읽기 및 실행
function initializeDatabase() {
  const schemaPath = path.join(__dirname, '../database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // 여러 SQL 문을 분리하여 실행
  const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);

  for (const statement of statements) {
    db.exec(statement);
  }

  console.log('데이터베이스 테이블 생성 완료!');
}

// 제품 카테고리
const categories = ['전자제품', '가구', '의류', '식품', '문구', '도서', '완구', '화장품', '주방용품', '스포츠용품'];

// 제품 이름 예시
const productNames = [
  '노트북', '마우스', '키보드', '모니터', '헤드셋', '웹캠', '스피커', '프린터',
  '책상', '의자', '책장', '서랍장', '소파', '침대', '테이블', '옷장',
  '티셔츠', '청바지', '자켓', '운동화', '모자', '가방', '벨트', '양말',
  '쌀', '라면', '과자', '음료수', '커피', '차', '빵', '우유',
  '볼펜', '연필', '지우개', '노트', '파일', '클립', '스테이플러', '테이프',
  '소설책', '만화책', '참고서', '잡지', '사전', '그림책', '요리책', '에세이',
  '인형', '블록', '보드게임', '퍼즐', '미니카', '로봇', '레고', '플레이도우',
  '로션', '크림', '립스틱', '마스카라', '파운데이션', '향수', '샴푸', '린스',
  '냄비', '프라이팬', '접시', '컵', '수저', '칼', '도마', '믹서기',
  '축구공', '농구공', '야구방망이', '배드민턴채', '테니스공', '골프채', '요가매트', '덤벨'
];

// 공급업체
const suppliers = [
  '(주)테크월드', '글로벌무역', '한국유통', '스마트공급사', '프리미엄상사',
  '베스트파트너', '유니버설트레이딩', '퍼스트공급', '탑클래스', '메가유통'
];

// 단위
const units = ['개', '박스', '세트', '팩', 'EA', '권', '병', '통'];

// 출고 사유
const reasons = [
  '판매', '반품', '폐기', '샘플제공', '이벤트', '기부', '파손', '소모'
];

function generateRandomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function generateProducts(count: number) {
  console.log(`제품 ${count}개 생성 중...`);

  const insertProduct = db.prepare(`
    INSERT INTO products (internal_code, unique_code, name, description, unit, unit_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (let i = 1; i <= count; i++) {
    const internalCode = `P${String(i).padStart(5, '0')}`;
    const uniqueCode = `UNQ-${String(i).padStart(6, '0')}`;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const name = productNames[Math.floor(Math.random() * productNames.length)] + ` ${i}`;
    const description = `${category} - ${name}`;
    const unit = units[Math.floor(Math.random() * units.length)];
    const unitPrice = Math.floor(Math.random() * 100000) + 1000; // 1,000 ~ 101,000원

    insertProduct.run(internalCode, uniqueCode, name, description, unit, unitPrice);
  }

  console.log(`제품 ${count}개 생성 완료!`);
}

function generateTransactions(productCount: number, transactionsPerProduct: number) {
  console.log(`거래 내역 생성 중...`);

  const insertTransaction = db.prepare(`
    INSERT INTO transactions (product_id, type, quantity, unit_price, total_amount, transaction_date, supplier, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const startDate = new Date('2024-01-01');
  const endDate = new Date('2025-03-31');

  let totalTransactions = 0;

  for (let productId = 1; productId <= productCount; productId++) {
    // 각 제품에 대해 입고/출고 거래 생성
    const numTransactions = Math.floor(Math.random() * transactionsPerProduct) + 1;

    for (let i = 0; i < numTransactions; i++) {
      const type = Math.random() > 0.4 ? 'INBOUND' : 'OUTBOUND'; // 60% 입고, 40% 출고
      const quantity = Math.floor(Math.random() * 100) + 1; // 1 ~ 100
      const unitPrice = Math.floor(Math.random() * 100000) + 1000;
      const totalAmount = quantity * unitPrice;
      const transactionDate = generateRandomDate(startDate, endDate);
      const supplier = type === 'INBOUND' ? suppliers[Math.floor(Math.random() * suppliers.length)] : null;
      const reason = type === 'OUTBOUND' ? reasons[Math.floor(Math.random() * reasons.length)] : null;

      insertTransaction.run(
        productId,
        type,
        quantity,
        unitPrice,
        totalAmount,
        transactionDate,
        supplier,
        reason
      );

      totalTransactions++;
    }
  }

  console.log(`거래 내역 ${totalTransactions}개 생성 완료!`);
}

function clearDatabase() {
  console.log('기존 데이터 삭제 중...');
  try {
    db.prepare('DELETE FROM transactions').run();
    db.prepare('DELETE FROM products').run();
    console.log('기존 데이터 삭제 완료!');
  } catch (error: any) {
    if (error.message.includes('no such table')) {
      console.log('테이블이 존재하지 않습니다. 새로 생성합니다.');
    } else {
      throw error;
    }
  }
}

function main() {
  try {
    // 데이터베이스 초기화
    initializeDatabase();

    // 기존 데이터 삭제
    clearDatabase();

    // 200개 제품 생성
    generateProducts(200);

    // 각 제품당 1~5개의 거래 내역 생성 (평균 3개)
    generateTransactions(200, 5);

    console.log('\n테스트 데이터 생성이 완료되었습니다!');
    console.log('- 제품: 200개');
    console.log('- 거래 내역: 약 400~600개');
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    db.close();
  }
}

main();
