import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/inventory.db');
const db = new Database(dbPath);

function updateCurrentStock() {
  console.log('재고 수량 업데이트 시작...');

  // 모든 제품의 current_stock을 거래 내역 기반으로 업데이트
  const updateStmt = db.prepare(`
    UPDATE products
    SET current_stock = (
      SELECT
        COALESCE(SUM(CASE WHEN t.type = 'INBOUND' THEN t.quantity ELSE -t.quantity END), 0)
      FROM transactions t
      WHERE t.product_id = products.id
    )
  `);

  const result = updateStmt.run();
  console.log(`${result.changes}개 제품의 재고 수량이 업데이트되었습니다.`);

  // 업데이트 결과 확인
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_products,
      SUM(current_stock) as total_stock,
      COUNT(CASE WHEN current_stock <= min_stock THEN 1 END) as low_stock_count
    FROM products
  `).get() as any;

  console.log('\n업데이트 결과:');
  console.log(`- 전체 제품: ${stats.total_products}개`);
  console.log(`- 총 재고량: ${stats.total_stock}`);
  console.log(`- 재고 부족 제품: ${stats.low_stock_count}개`);

  db.close();
  console.log('\n완료!');
}

updateCurrentStock();
