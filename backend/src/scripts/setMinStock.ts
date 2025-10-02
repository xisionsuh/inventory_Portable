import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/inventory.db');
const db = new Database(dbPath);

function setMinStock() {
  console.log('최소 재고량을 다양하게 설정 중...');

  // 각 제품을 3가지 그룹으로 나누어 설정
  // 그룹 1 (30%): 재고 정상 - min_stock이 current_stock보다 낮음
  // 그룹 2 (40%): 재고 부족 - min_stock이 current_stock보다 약간 높음
  // 그룹 3 (30%): 재고 없음 - current_stock = 0

  const products = db.prepare('SELECT id, current_stock FROM products').all() as any[];

  let normalCount = 0;
  let lowCount = 0;
  let outCount = 0;

  products.forEach((product, index) => {
    const groupIndex = index % 10;
    let minStock = 10;
    let currentStock = product.current_stock;

    if (groupIndex < 3) {
      // 30%: 정상 재고
      if (currentStock > 20) {
        minStock = Math.floor(currentStock * 0.3) + (Math.floor(Math.random() * 10));
      } else {
        minStock = Math.max(1, Math.floor(currentStock * 0.5));
      }
      normalCount++;
    } else if (groupIndex < 7) {
      // 40%: 재고 부족
      if (currentStock > 0) {
        minStock = currentStock + (Math.floor(Math.random() * 20)) + 5;
      } else {
        minStock = 10;
        currentStock = Math.floor(Math.random() * 5) + 1; // 1-5개
      }
      lowCount++;
    } else {
      // 30%: 재고 없음
      currentStock = 0;
      minStock = Math.floor(Math.random() * 20) + 10;
      outCount++;
    }

    db.prepare('UPDATE products SET min_stock = ?, current_stock = ? WHERE id = ?')
      .run(minStock, currentStock, product.id);
  });

  console.log(`\n설정 완료:`);
  console.log(`- 정상 재고: ${normalCount}개 (30%)`);
  console.log(`- 재고 부족: ${lowCount}개 (40%)`);
  console.log(`- 재고 없음: ${outCount}개 (30%)`);

  db.close();
  console.log('\n완료!');
}

setMinStock();
