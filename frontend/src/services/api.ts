import axios, { AxiosResponse } from 'axios';
import {
  Product,
  CreateProductData,
  UpdateProductData,
  Transaction,
  TransactionWithProduct,
  InboundTransactionData,
  OutboundTransactionData,
  InventoryStatus,
  InventorySummary,
  ApiResponse,
} from '../types';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    console.log(`API 요청: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API 응답 오류:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// 제품 API
export const productApi = {
  // 모든 제품 조회
  getAll: (search?: string): Promise<AxiosResponse<ApiResponse<Product[]>>> => {
    const params = search ? { search } : {};
    return api.get('/products', { params });
  },

  // 특정 제품 조회
  getById: (id: number): Promise<AxiosResponse<ApiResponse<Product>>> => {
    return api.get(`/products/${id}`);
  },

  // 제품 생성
  create: (data: CreateProductData): Promise<AxiosResponse<ApiResponse<Product>>> => {
    return api.post('/products', data);
  },

  // 제품 수정
  update: (id: number, data: UpdateProductData): Promise<AxiosResponse<ApiResponse<Product>>> => {
    return api.put(`/products/${id}`, data);
  },

  // 제품 삭제
  delete: (id: number): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.delete(`/products/${id}`);
  },

  // 내부 관리 번호로 조회
  getByInternalCode: (code: string): Promise<AxiosResponse<ApiResponse<Product>>> => {
    return api.get(`/products/code/internal/${code}`);
  },

  // 고유 번호로 조회
  getByUniqueCode: (code: string): Promise<AxiosResponse<ApiResponse<Product>>> => {
    return api.get(`/products/code/unique/${code}`);
  },

  // 재고 부족 제품 조회
  getLowStock: (): Promise<AxiosResponse<ApiResponse<Product[]>>> => {
    return api.get('/products/status/low-stock');
  },
};

// 거래 API
export const transactionApi = {
  // 모든 거래 내역 조회
  getAll: (params?: {
    product_id?: number;
    type?: 'INBOUND' | 'OUTBOUND';
    start_date?: string;
    end_date?: string;
  }): Promise<AxiosResponse<ApiResponse<TransactionWithProduct[]>>> => {
    return api.get('/transactions', { params });
  },

  // 특정 거래 내역 조회
  getById: (id: number): Promise<AxiosResponse<ApiResponse<Transaction>>> => {
    return api.get(`/transactions/${id}`);
  },

  // 입고 처리
  processInbound: (data: InboundTransactionData): Promise<AxiosResponse<ApiResponse<Transaction>>> => {
    return api.post('/transactions/inbound', data);
  },

  // 출고 처리
  processOutbound: (data: OutboundTransactionData): Promise<AxiosResponse<ApiResponse<Transaction>>> => {
    return api.post('/transactions/outbound', data);
  },

  // 거래 내역 삭제
  delete: (id: number): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.delete(`/transactions/${id}`);
  },

  // 제품별 거래 내역 조회
  getByProductId: (productId: number): Promise<AxiosResponse<ApiResponse<TransactionWithProduct[]>>> => {
    return api.get(`/transactions/product/${productId}`);
  },

  // 거래 유형별 조회
  getByType: (type: 'INBOUND' | 'OUTBOUND'): Promise<AxiosResponse<ApiResponse<TransactionWithProduct[]>>> => {
    return api.get(`/transactions/type/${type}`);
  },
};

// 재고 API
export const inventoryApi = {
  // 현재 재고 현황 조회
  getCurrent: (): Promise<AxiosResponse<ApiResponse<InventoryStatus[]>>> => {
    return api.get('/inventory/current');
  },

  // 재고 요약 정보 조회
  getSummary: (): Promise<AxiosResponse<ApiResponse<InventorySummary>>> => {
    return api.get('/inventory/summary');
  },

  // 재고 부족 제품 조회
  getLowStock: (): Promise<AxiosResponse<ApiResponse<InventoryStatus[]>>> => {
    return api.get('/inventory/low-stock');
  },

  // 재고 없는 제품 조회
  getOutOfStock: (): Promise<AxiosResponse<ApiResponse<InventoryStatus[]>>> => {
    return api.get('/inventory/out-of-stock');
  },

  // 제품별 재고 이동 내역
  getMovements: (productId: number, days?: number): Promise<AxiosResponse<ApiResponse<any[]>>> => {
    const params = days ? { days } : {};
    return api.get(`/inventory/movements/${productId}`, { params });
  },

  // 재고 회전율 조회
  getTurnover: (productId?: number): Promise<AxiosResponse<ApiResponse<any[]>>> => {
    const params = productId ? { product_id: productId } : {};
    return api.get('/inventory/turnover', { params });
  },

  // 특정 제품의 재고 상태 조회
  getProductStatus: (productId: number): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get(`/inventory/status/${productId}`);
  },
};

// 내보내기 API
export const exportApi = {
  // 제품 목록 엑셀 다운로드
  exportProducts: (search?: string): string => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return `/api/export/products${params}`;
  },

  // 재고 현황 엑셀 다운로드
  exportInventory: (): string => {
    return '/api/export/inventory';
  },

  // 거래 내역 엑셀 다운로드
  exportTransactions: (params?: {
    start_date?: string;
    end_date?: string;
    type?: 'INBOUND' | 'OUTBOUND';
  }): string => {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    if (params?.type) searchParams.append('type', params.type);
    
    const queryString = searchParams.toString();
    return `/api/export/transactions${queryString ? `?${queryString}` : ''}`;
  },

  // 재고 부족 제품 엑셀 다운로드
  exportLowStock: (): string => {
    return '/api/export/low-stock';
  },

  // 입고 내역 엑셀 다운로드
  exportInbound: (params?: { start_date?: string; end_date?: string }): string => {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    
    const queryString = searchParams.toString();
    return `/api/export/transactions/inbound${queryString ? `?${queryString}` : ''}`;
  },

  // 출고 내역 엑셀 다운로드
  exportOutbound: (params?: { start_date?: string; end_date?: string }): string => {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    
    const queryString = searchParams.toString();
    return `/api/export/transactions/outbound${queryString ? `?${queryString}` : ''}`;
  },
};

export default api;