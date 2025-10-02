import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/inventory.db');
const db = new Database(dbPath);

const suppliers = [
  '(주)테크월드', '글로벌무역', '한국유통', '스마트공급사', '프리미엄상사'
];

const reasons = [
  '판매', '반품', '샘플제공', '이벤트'
];

function addRecentTransactions() {
  console.log('최근 거래 내역 추가 중...');

  // 최근 30일 내의 날짜 생성
  const today = new Date();
  const dates = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  const insertTransaction = db.prepare(`
    INSERT INTO transactions (product_id, type, quantity, unit_price, total_amount, transaction_date, supplier, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;

  // 각 제품에 1-3개의 최근 거래 추가
  for (let productId = 1; productId <= 200; productId++) {
    const numTransactions = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numTransactions; i++) {
      const type = Math.random() > 0.5 ? 'INBOUND' : 'OUTBOUND';
      const quantity = Math.floor(Math.random() * 50) + 1;
      const unitPrice = Math.floor(Math.random() * 50000) + 1000;
      const totalAmount = quantity * unitPrice;
      const transactionDate = dates[Math.floor(Math.random() * dates.length)];
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

      count++;
    }
  }

  console.log(`${count}개의 최근 거래 내역이 추가되었습니다.`);

  // 재고 수량 업데이트
  console.log('\n재고 수량 업데이트 중...');
  const updateStmt = db.prepare(`
    UPDATE products
    SET current_stock = (
      SELECT
        COALESCE(SUM(CASE WHEN t.type = 'INBOUND' THEN t.quantity ELSE -t.quantity END), 0)
      FROM transactions t
      WHERE t.product_id = products.id
    )
  `);

  updateStmt.run();
  console.log('재고 수량 업데이트 완료!');

  db.close();
  console.log('\n완료!');
}

addRecentTransactions();
