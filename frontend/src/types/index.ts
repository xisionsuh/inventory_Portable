// Product 타입 정의
export interface Product {
  id: number;
  internal_code: string;
  unique_code: string;
  name: string;
  description?: string;
  unit: string;
  unit_price: number;
  min_stock: number;
  current_stock: number;
  created_at: string;
  updated_at: string;
}

// 제품 생성 데이터
export interface CreateProductData {
  unique_code: string;
  name: string;
  description?: string;
  unit: string;
  unit_price?: number;
  min_stock?: number;
}

// 제품 업데이트 데이터
export interface UpdateProductData {
  unique_code?: string;
  name?: string;
  description?: string;
  unit?: string;
  unit_price?: number;
  min_stock?: number;
}

// Transaction 타입
export type TransactionType = 'INBOUND' | 'OUTBOUND';

export interface Transaction {
  id: number;
  product_id: number;
  type: TransactionType;
  quantity: number;
  unit_price?: number;
  total_amount?: number;
  supplier?: string;
  reason?: string;
  transaction_date: string;
  created_at: string;
}

// 제품 정보가 포함된 거래 내역
export interface TransactionWithProduct extends Transaction {
  product_name: string;
  product_internal_code: string;
  product_unique_code: string;
  product_unit: string;
}

// 입고 데이터
export interface InboundTransactionData {
  product_id: number;
  quantity: number;
  unit_price?: number;
  supplier?: string;
  transaction_date: string;
}

// 출고 데이터
export interface OutboundTransactionData {
  product_id: number;
  quantity: number;
  reason?: string;
  transaction_date: string;
}

// 재고 현황
export interface InventoryStatus extends Product {
  is_low_stock: boolean;
  stock_status: 'NORMAL' | 'LOW' | 'OUT_OF_STOCK';
  total_inbound: number;
  total_outbound: number;
  last_inbound_date?: string;
  last_outbound_date?: string;
}

// 재고 요약 정보
export interface InventorySummary {
  total_products: number;
  total_stock_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  recent_transactions_count: number;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

// API 에러 타입
export interface ApiError {
  error: boolean;
  message: string;
  timestamp: string;
  path: string;
  method: string;
}

// User 타입
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  is_active: number;
  last_login?: string;
  created_at: string;
}

// 로그인 데이터
export interface LoginData {
  username: string;
  password: string;
}

// 회원가입 데이터
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: 'admin' | 'user';
}

// Activity Log 타입
export interface ActivityLog {
  id: number;
  user_id: number;
  action_type: string;
  table_name: string;
  record_id?: number;
  old_data?: string;
  new_data?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  username?: string;
  full_name?: string;
}

// Backup 타입
export interface Backup {
  filename: string;
  path: string;
  size: number;
  created_at: Date;
  meta?: {
    backup_time: string;
    reason: string;
    original_path: string;
    file_size: number;
  };
}