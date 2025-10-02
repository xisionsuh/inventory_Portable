// Transaction 타입 정의
export type TransactionType = 'INBOUND' | 'OUTBOUND';

// Transaction 인터페이스 정의
export interface Transaction {
  id?: number;
  product_id: number;
  type: TransactionType;
  quantity: number;
  unit_price?: number;
  total_amount?: number;
  supplier?: string;
  reason?: string;
  transaction_date: string;
  created_at?: string;
}

// 입고 데이터 인터페이스
export interface InboundTransactionData {
  product_id: number;
  quantity: number;
  unit_price?: number;
  supplier?: string;
  transaction_date: string;
}

// 출고 데이터 인터페이스
export interface OutboundTransactionData {
  product_id: number;
  quantity: number;
  reason?: string;
  transaction_date: string;
}

// 거래 내역 조회용 확장 인터페이스 (제품 정보 포함)
export interface TransactionWithProduct extends Transaction {
  product_name: string;
  product_internal_code: string;
  product_unique_code: string;
  product_unit: string;
}