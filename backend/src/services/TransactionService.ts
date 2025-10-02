import { db } from '../config/database';
import { 
  Transaction, 
  InboundTransactionData, 
  OutboundTransactionData, 
  TransactionWithProduct 
} from '../models/Transaction';
import { ProductService } from './ProductService';

export class TransactionService {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  // 모든 거래 내역 조회 (제품 정보 포함)
  async getAllTransactions(): Promise<TransactionWithProduct[]> {
    const transactions = await db.all(`
      SELECT 
        t.*,
        p.name as product_name,
        p.internal_code as product_internal_code,
        p.unique_code as product_unique_code,
        p.unit as product_unit
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      ORDER BY t.created_at DESC
    `);
    return transactions;
  }

  // ID로 거래 내역 조회
  async getTransactionById(id: number): Promise<Transaction | null> {
    const transaction = await db.get(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );
    return transaction || null;
  }

  // 제품별 거래 내역 조회
  async getTransactionsByProductId(productId: number): Promise<TransactionWithProduct[]> {
    const transactions = await db.all(`
      SELECT 
        t.*,
        p.name as product_name,
        p.internal_code as product_internal_code,
        p.unique_code as product_unique_code,
        p.unit as product_unit
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      WHERE t.product_id = ?
      ORDER BY t.created_at DESC
    `, [productId]);
    return transactions;
  }

  // 날짜 범위로 거래 내역 조회
  async getTransactionsByDateRange(startDate: string, endDate: string): Promise<TransactionWithProduct[]> {
    const transactions = await db.all(`
      SELECT 
        t.*,
        p.name as product_name,
        p.internal_code as product_internal_code,
        p.unique_code as product_unique_code,
        p.unit as product_unit
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      WHERE t.transaction_date BETWEEN ? AND ?
      ORDER BY t.created_at DESC
    `, [startDate, endDate]);
    return transactions;
  }

  // 입고 처리
  async processInbound(inboundData: InboundTransactionData): Promise<Transaction> {
    // 제품 존재 확인
    const product = await this.productService.getProductById(inboundData.product_id);
    if (!product) {
      throw new Error('존재하지 않는 제품입니다.');
    }

    // 총액 계산
    const totalAmount = inboundData.unit_price 
      ? inboundData.unit_price * inboundData.quantity 
      : null;

    // 트랜잭션 시작
    await db.beginTransaction();

    try {
      // 거래 내역 생성
      const result = await db.run(`
        INSERT INTO transactions (product_id, type, quantity, unit_price, total_amount, supplier, transaction_date)
        VALUES (?, 'INBOUND', ?, ?, ?, ?, ?)
      `, [
        inboundData.product_id,
        inboundData.quantity,
        inboundData.unit_price || null,
        totalAmount,
        inboundData.supplier || null,
        inboundData.transaction_date
      ]);

      // 재고 수량 증가
      const newStock = product.current_stock + inboundData.quantity;
      await this.productService.updateStock(inboundData.product_id, newStock);

      // 트랜잭션 커밋
      await db.commit();

      // 생성된 거래 내역 반환
      const newTransaction = await this.getTransactionById(result.lastID!);
      if (!newTransaction) {
        throw new Error('거래 내역 생성 후 조회에 실패했습니다.');
      }

      return newTransaction;
    } catch (error) {
      // 트랜잭션 롤백
      await db.rollback();
      throw error;
    }
  }

  // 출고 처리
  async processOutbound(outboundData: OutboundTransactionData): Promise<Transaction> {
    // 제품 존재 확인
    const product = await this.productService.getProductById(outboundData.product_id);
    if (!product) {
      throw new Error('존재하지 않는 제품입니다.');
    }

    // 재고 부족 확인
    if (product.current_stock < outboundData.quantity) {
      throw new Error(`재고가 부족합니다. 현재 재고: ${product.current_stock}${product.unit}, 요청 수량: ${outboundData.quantity}${product.unit}`);
    }

    // 트랜잭션 시작
    await db.beginTransaction();

    try {
      // 거래 내역 생성
      const result = await db.run(`
        INSERT INTO transactions (product_id, type, quantity, reason, transaction_date)
        VALUES (?, 'OUTBOUND', ?, ?, ?)
      `, [
        outboundData.product_id,
        outboundData.quantity,
        outboundData.reason || null,
        outboundData.transaction_date
      ]);

      // 재고 수량 감소
      const newStock = product.current_stock - outboundData.quantity;
      await this.productService.updateStock(outboundData.product_id, newStock);

      // 트랜잭션 커밋
      await db.commit();

      // 생성된 거래 내역 반환
      const newTransaction = await this.getTransactionById(result.lastID!);
      if (!newTransaction) {
        throw new Error('거래 내역 생성 후 조회에 실패했습니다.');
      }

      return newTransaction;
    } catch (error) {
      // 트랜잭션 롤백
      await db.rollback();
      throw error;
    }
  }

  // 거래 내역 삭제 (관리자용)
  async deleteTransaction(id: number): Promise<void> {
    const transaction = await this.getTransactionById(id);
    if (!transaction) {
      throw new Error('존재하지 않는 거래 내역입니다.');
    }

    const product = await this.productService.getProductById(transaction.product_id);
    if (!product) {
      throw new Error('연관된 제품을 찾을 수 없습니다.');
    }

    // 트랜잭션 시작
    await db.beginTransaction();

    try {
      // 재고 수량 복원
      let newStock: number;
      if (transaction.type === 'INBOUND') {
        // 입고 내역 삭제 시 재고 감소
        newStock = product.current_stock - transaction.quantity;
      } else {
        // 출고 내역 삭제 시 재고 증가
        newStock = product.current_stock + transaction.quantity;
      }

      if (newStock < 0) {
        throw new Error('재고 수량이 음수가 될 수 없습니다.');
      }

      await this.productService.updateStock(transaction.product_id, newStock);

      // 거래 내역 삭제
      await db.run('DELETE FROM transactions WHERE id = ?', [id]);

      // 트랜잭션 커밋
      await db.commit();
    } catch (error) {
      // 트랜잭션 롤백
      await db.rollback();
      throw error;
    }
  }

  // 거래 유형별 조회
  async getTransactionsByType(type: 'INBOUND' | 'OUTBOUND'): Promise<TransactionWithProduct[]> {
    const transactions = await db.all(`
      SELECT 
        t.*,
        p.name as product_name,
        p.internal_code as product_internal_code,
        p.unique_code as product_unique_code,
        p.unit as product_unit
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      WHERE t.type = ?
      ORDER BY t.created_at DESC
    `, [type]);
    return transactions;
  }
}