// Product 인터페이스 정의
export interface Product {
  id?: number;
  internal_code: string;
  unique_code: string;
  name: string;
  description?: string;
  unit: string;
  unit_price: number;
  min_stock: number;
  current_stock: number;
  created_at?: string;
  updated_at?: string;
}

// 제품 생성을 위한 인터페이스 (ID 제외)
export interface CreateProductData {
  unique_code: string;
  name: string;
  description?: string;
  unit: string;
  unit_price?: number;
  min_stock?: number;
}

// 제품 업데이트를 위한 인터페이스
export interface UpdateProductData {
  unique_code?: string;
  name?: string;
  description?: string;
  unit?: string;
  unit_price?: number;
  min_stock?: number;
}