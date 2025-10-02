import { db } from '../config/database';
import fs from 'fs';
import path from 'path';

// 데이터베이스 초기화 함수
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('데이터베이스 초기화를 시작합니다...');

    // 스키마 파일 읽기
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // SQL 문을 세미콜론으로 분리하여 실행
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      await db.run(statement);
    }

    console.log('데이터베이스 초기화가 완료되었습니다.');
  } catch (error) {
    console.error('데이터베이스 초기화 중 오류 발생:', error);
    throw error;
  }
}

// 기존 데이터 초기화 함수
export async function resetSampleData(): Promise<void> {
  try {
    console.log('기존 샘플 데이터를 초기화합니다...');
    
    // 기존 데이터 삭제
    await db.run('DELETE FROM transactions');
    await db.run('DELETE FROM products');
    
    // 자동 증가 값 초기화
    await db.run('DELETE FROM sqlite_sequence WHERE name IN ("products", "transactions")');
    
    console.log('기존 데이터 초기화가 완료되었습니다.');
  } catch (error) {
    console.error('데이터 초기화 중 오류 발생:', error);
    throw error;
  }
}

// 샘플 데이터 삽입 함수 (개발용)
export async function insertSampleData(): Promise<void> {
  try {
    console.log('샘플 데이터를 삽입합니다...');

    // 기존 데이터 확인
    const existingProducts = await db.get('SELECT COUNT(*) as count FROM products');
    if (existingProducts.count > 3) {
      console.log('샘플 데이터가 이미 존재합니다.');
      return;
    }

    // 제품 카테고리별 샘플 데이터 생성
    const categories = [
      { name: '전자제품', units: ['대', '개'], prefix: 'ELEC' },
      { name: '사무용품', units: ['개', '박스', '세트'], prefix: 'OFFICE' },
      { name: '가구', units: ['개', '세트'], prefix: 'FURN' },
      { name: '의류', units: ['벌', '개'], prefix: 'CLOTH' },
      { name: '도서', units: ['권', '세트'], prefix: 'BOOK' },
      { name: '식품', units: ['개', 'kg', 'L'], prefix: 'FOOD' },
      { name: '화장품', units: ['개', 'mL'], prefix: 'COSM' },
      { name: '스포츠용품', units: ['개', '세트'], prefix: 'SPORT' },
      { name: '자동차부품', units: ['개', '세트'], prefix: 'AUTO' },
      { name: '건축자재', units: ['개', 'm', 'kg'], prefix: 'BUILD' }
    ];

    const productNames = [
      // 전자제품
      ['노트북 컴퓨터', '데스크톱 PC', '모니터', '키보드', '마우스', '스피커', '헤드폰', '웹캠', 'USB 허브', '외장하드', '메모리카드', 'USB 케이블', 'HDMI 케이블', '무선충전기', '블루투스 이어폰', '태블릿', '스마트워치', '프린터', '스캐너', '라우터'],
      // 사무용품
      ['A4 용지', '볼펜', '연필', '지우개', '스테이플러', '클립', '포스트잇', '파일', '바인더', '계산기', '라벨지', '테이프', '가위', '칼', '자', '형광펜', '마커펜', '화이트보드', '코팅지', '라미네이터'],
      // 가구
      ['사무용 의자', '책상', '서랍장', '책장', '소파', '테이블', '침대', '옷장', '신발장', '화장대', '식탁', '의자', '스탠드', '행거', '수납함', '선반', '파티션', '사물함', '벤치', '스툴'],
      // 의류
      ['정장 셔츠', '넥타이', '양복', '블라우스', '바지', '치마', '재킷', '코트', '스웨터', '티셔츠', '청바지', '운동복', '속옷', '양말', '스타킹', '벨트', '모자', '장갑', '스카프', '가방'],
      // 도서
      ['경영학 개론', '회계학', '마케팅', '인사관리', '재무관리', '생산관리', '품질관리', '프로젝트관리', '리더십', '커뮤니케이션', '컴퓨터활용', '엑셀 활용', '파워포인트', '프레젠테이션', '비즈니스 영어', '법무', '세무', '노무', '안전관리', '환경관리'],
      // 식품
      ['생수', '커피', '차', '과자', '초콜릿', '사탕', '견과류', '과일', '샐러드', '샌드위치', '도시락', '라면', '빵', '우유', '요구르트', '치즈', '햄', '소시지', '계란', '쌀'],
      // 화장품
      ['로션', '토너', '세럼', '크림', '클렌징폼', '선크림', '파운데이션', '립스틱', '아이섀도', '마스카라', '아이라이너', '블러셔', '하이라이터', '네일', '향수', '바디로션', '샴푸', '린스', '바디워시', '치약'],
      // 스포츠용품
      ['축구공', '농구공', '배구공', '테니스공', '탁구공', '배드민턴 셔틀콕', '골프공', '야구공', '운동화', '운동복', '수영복', '수영모', '수영안경', '헬스용품', '요가매트', '덤벨', '줄넘기', '농구대', '축구골대', '테니스라켓'],
      // 자동차부품
      ['엔진오일', '브레이크패드', '타이어', '배터리', '점화플러그', '에어필터', '연료필터', '와이퍼', '전구', '퓨즈', '벨트', '호스', '냉각수', '부동액', '세차용품', '방향제', '시트커버', '핸들커버', '발매트', '썬팅필름'],
      // 건축자재
      ['시멘트', '모래', '자갈', '벽돌', '블록', '철근', '철판', '목재', '합판', '석고보드', '단열재', '방수재', '타일', '페인트', '접착제', '실리콘', '못', '나사', '볼트', '너트']
    ];

    const suppliers = [
      '(주)테크솔루션', '글로벌트레이딩', '코리아디스트리뷰션', '(주)비즈니스파트너', '유니버설서플라이',
      '(주)프리미엄굿즈', '스마트로지스틱스', '(주)퀄리티머천트', '이노베이션트레이드', '(주)익스프레스',
      '월드와이드서플라이', '(주)베스트파트너', '그린로지스틱스', '(주)퍼스트클래스', '다이나믹트레이딩'
    ];

    const reasons = [
      '판매', '샘플 제공', '불량품 교체', '전시용', '테스트용', '기부', '폐기', '반품', '이벤트 사용', '직원 복리후생',
      '마케팅 활동', '고객 서비스', '품질 검사', '연구개발', '교육용'
    ];

    // 200개 제품 생성
    const products = [];
    for (let i = 1; i <= 200; i++) {
      const categoryIndex = Math.floor(Math.random() * categories.length);
      const category = categories[categoryIndex];
      const productNameIndex = Math.floor(Math.random() * productNames[categoryIndex].length);
      const productName = productNames[categoryIndex][productNameIndex];
      const unit = category.units[Math.floor(Math.random() * category.units.length)];
      const minStock = Math.floor(Math.random() * 50) + 5;
      
      const product = {
        internal_code: `P${i.toString().padStart(6, '0')}`,
        unique_code: `${category.prefix}-${i.toString().padStart(3, '0')}`,
        name: `${productName} ${Math.floor(Math.random() * 100) + 1}호`,
        description: `${category.name} - ${productName}`,
        unit: unit,
        unit_price: Math.floor(Math.random() * 100000) + 1000, // 1,000원 ~ 100,000원
        min_stock: minStock,
        current_stock: 0 // 초기 재고는 0으로 설정
      };
      products.push(product);
    }

    // 제품 데이터 삽입
    for (const product of products) {
      await db.run(`
        INSERT OR IGNORE INTO products 
        (internal_code, unique_code, name, description, unit, unit_price, min_stock, current_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        product.internal_code,
        product.unique_code,
        product.name,
        product.description,
        product.unit,
        product.unit_price,
        product.min_stock,
        product.current_stock
      ]);
    }

    // 거래 내역 생성 (각 제품당 여러 번의 입고/출고)
    const productIds = await db.all('SELECT id FROM products ORDER BY id');
    
    for (const productRow of productIds) {
      const productId = productRow.id;
      let currentStock = 0;
      
      // 각 제품당 5-15개의 거래 생성
      const transactionCount = Math.floor(Math.random() * 11) + 5;
      
      for (let j = 0; j < transactionCount; j++) {
        const isInbound = Math.random() > 0.3; // 70% 확률로 입고
        const quantity = Math.floor(Math.random() * 50) + 1;
        
        // 날짜 생성 (최근 6개월 내)
        const daysAgo = Math.floor(Math.random() * 180);
        const transactionDate = new Date();
        transactionDate.setDate(transactionDate.getDate() - daysAgo);
        const dateString = transactionDate.toISOString().split('T')[0];
        
        if (isInbound) {
          // 입고 처리
          const unitPrice = Math.floor(Math.random() * 100000) + 1000;
          const totalAmount = unitPrice * quantity;
          const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
          
          await db.run(`
            INSERT INTO transactions (product_id, type, quantity, unit_price, total_amount, supplier, transaction_date)
            VALUES (?, 'INBOUND', ?, ?, ?, ?, ?)
          `, [productId, quantity, unitPrice, totalAmount, supplier, dateString]);
          
          currentStock += quantity;
        } else {
          // 출고 처리 (재고가 있을 때만)
          if (currentStock >= quantity) {
            const reason = reasons[Math.floor(Math.random() * reasons.length)];
            
            await db.run(`
              INSERT INTO transactions (product_id, type, quantity, reason, transaction_date)
              VALUES (?, 'OUTBOUND', ?, ?, ?)
            `, [productId, quantity, reason, dateString]);
            
            currentStock -= quantity;
          }
        }
      }
      
      // 최종 재고 수량 업데이트
      await db.run(`
        UPDATE products SET current_stock = ? WHERE id = ?
      `, [currentStock, productId]);
    }

    console.log('200개 제품과 거래 내역 샘플 데이터 삽입이 완료되었습니다.');
  } catch (error) {
    console.error('샘플 데이터 삽입 중 오류 발생:', error);
    throw error;
  }
}