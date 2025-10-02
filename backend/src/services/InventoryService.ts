import { db } from '../config/database';
import { Product } from '../models/Product';

// 재고 현황 인터페이스
export interface InventoryStatus extends Product {
  is_low_stock: boolean;
  stock_status: 'NORMAL' | 'LOW' | 'OUT_OF_STOCK';
  total_inbound: number;
  total_outbound: number;
  last_inbound_date?: string;
  last_outbound_date?: string;
}

// 재고 요약 정보 인터페이스
export interface InventorySummary {
  total_products: number;
  total_stock_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  recent_transactions_count: number;
}

export class InventoryService {
  // 현재 재고 현황 조회
  async getCurrentInventory(): Promise<InventoryStatus[]> {
    const products = await db.all(`
      SELECT 
        p.*,
        CASE 
          WHEN p.current_stock <= 0 THEN 'OUT_OF_STOCK'
          WHEN p.current_stock <= p.min_stock THEN 'LOW'
          ELSE 'NORMAL'
        END as stock_status,
        CASE 
          WHEN p.current_stock <= p.min_stock THEN 1
          ELSE 0
        END as is_low_stock,
        COALESCE(inbound.total_inbound, 0) as total_inbound,
        COALESCE(outbound.total_outbound, 0) as total_outbound,
        inbound.last_inbound_date,
        outbound.last_outbound_date
      FROM products p
      LEFT JOIN (
        SELECT 
          product_id,
          SUM(quantity) as total_inbound,
          MAX(transaction_date) as last_inbound_date
        FROM transactions 
        WHERE type = 'INBOUND'
        GROUP BY product_id
      ) inbound ON p.id = inbound.product_id
      LEFT JOIN (
        SELECT 
          product_id,
          SUM(quantity) as total_outbound,
          MAX(transaction_date) as last_outbound_date
        FROM transactions 
        WHERE type = 'OUTBOUND'
        GROUP BY product_id
      ) outbound ON p.id = outbound.product_id
      ORDER BY p.name
    `);

    return products.map(product => ({
      ...product,
      is_low_stock: Boolean(product.is_low_stock),
      total_inbound: product.total_inbound || 0,
      total_outbound: product.total_outbound || 0
    }));
  }

  // 재고 요약 정보 조회
  async getInventorySummary(): Promise<InventorySummary> {
    // 전체 제품 수
    const totalProductsResult = await db.get('SELECT COUNT(*) as count FROM products');
    const total_products = totalProductsResult.count;

    // 재고 부족 제품 수 (현재 재고가 최소 재고보다 작거나 같은 경우)
    const lowStockResult = await db.get(`
      SELECT COUNT(*) as count FROM products
      WHERE current_stock > 0 AND current_stock <= min_stock
    `);
    const low_stock_count = lowStockResult.count;

    // 재고 없는 제품 수
    const outOfStockResult = await db.get(`
      SELECT COUNT(*) as count FROM products
      WHERE current_stock <= 0
    `);
    const out_of_stock_count = outOfStockResult.count;

    // 최근 30일간 거래 건수 (테스트 데이터 고려)
    const recentTransactionsResult = await db.get(`
      SELECT COUNT(*) as count FROM transactions
      WHERE date(transaction_date) >= date('now', '-30 days')
    `);
    const recent_transactions_count = recentTransactionsResult.count;

    // 총 재고 가치 계산 (최근 입고 단가 기준)
    const stockValueResult = await db.get(`
      SELECT 
        COALESCE(SUM(
          p.current_stock * COALESCE(
            (SELECT t.unit_price 
             FROM transactions t 
             WHERE t.product_id = p.id 
               AND t.type = 'INBOUND' 
               AND t.unit_price IS NOT NULL 
             ORDER BY t.created_at DESC 
             LIMIT 1), 0)
        ), 0) as total_value
      FROM products p
    `);
    const total_stock_value = stockValueResult.total_value || 0;

    return {
      total_products,
      total_stock_value,
      low_stock_count,
      out_of_stock_count,
      recent_transactions_count
    };
  }

  // 재고 부족 제품 조회
  async getLowStockProducts(): Promise<InventoryStatus[]> {
    const products = await db.all(`
      SELECT 
        *,
        CASE 
          WHEN current_stock <= 0 THEN 'OUT_OF_STOCK'
          WHEN current_stock <= min_stock THEN 'LOW'
          ELSE 'NORMAL'
        END as stock_status,
        1 as is_low_stock
      FROM products
      WHERE current_stock <= min_stock
      ORDER BY 
        CASE WHEN current_stock <= 0 THEN 0 ELSE 1 END,
        current_stock ASC,
        name
    `);

    return products.map(product => ({
      ...product,
      is_low_stock: true
    }));
  }

  // 재고 없는 제품 조회
  async getOutOfStockProducts(): Promise<InventoryStatus[]> {
    const products = await db.all(`
      SELECT 
        *,
        'OUT_OF_STOCK' as stock_status,
        1 as is_low_stock
      FROM products
      WHERE current_stock <= 0
      ORDER BY name
    `);

    return products.map(product => ({
      ...product,
      stock_status: 'OUT_OF_STOCK' as const,
      is_low_stock: true
    }));
  }

  // 제품별 재고 이동 내역 조회
  async getStockMovements(productId: number, days: number = 30): Promise<any[]> {
    const movements = await db.all(`
      SELECT 
        t.transaction_date,
        t.type,
        t.quantity,
        t.supplier,
        t.reason,
        t.created_at,
        -- 해당 거래 후의 재고 수량 계산
        (
          SELECT p.current_stock - COALESCE(SUM(
            CASE 
              WHEN t2.type = 'INBOUND' THEN -t2.quantity
              WHEN t2.type = 'OUTBOUND' THEN t2.quantity
            END
          ), 0)
          FROM transactions t2 
          WHERE t2.product_id = t.product_id 
            AND t2.created_at > t.created_at
        ) as stock_after_transaction
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      WHERE t.product_id = ? 
        AND t.transaction_date >= date('now', '-' || ? || ' days')
      ORDER BY t.created_at DESC
    `, [productId, days]);

    return movements;
  }

  // 재고 회전율 계산 (최근 30일 기준)
  async getStockTurnover(productId?: number): Promise<any[]> {
    const whereClause = productId ? 'WHERE p.id = ?' : '';
    const params = productId ? [productId] : [];

    const turnoverData = await db.all(`
      SELECT 
        p.id,
        p.name,
        p.internal_code,
        p.current_stock,
        COALESCE(outbound.total_outbound, 0) as total_outbound_30days,
        CASE 
          WHEN p.current_stock > 0 AND outbound.total_outbound > 0 
          THEN ROUND(outbound.total_outbound * 1.0 / p.current_stock, 2)
          ELSE 0
        END as turnover_ratio
      FROM products p
      LEFT JOIN (
        SELECT 
          product_id,
          SUM(quantity) as total_outbound
        FROM transactions 
        WHERE type = 'OUTBOUND' 
          AND transaction_date >= date('now', '-30 days')
        GROUP BY product_id
      ) outbound ON p.id = outbound.product_id
      ${whereClause}
      ORDER BY turnover_ratio DESC, p.name
    `, params);

    return turnoverData;
  }
}