import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import {
  Product,
  InventoryStatus,
  InventorySummary,
  TransactionWithProduct,
  CreateProductData,
  UpdateProductData,
  InboundTransactionData,
  OutboundTransactionData,
} from '../types';
import { productApi, inventoryApi, transactionApi } from '../services/api';

// 상태 타입 정의
interface InventoryState {
  products: Product[];
  inventory: InventoryStatus[];
  transactions: TransactionWithProduct[];
  summary: InventorySummary | null;
  loading: boolean;
  error: string | null;
}

// 액션 타입 정의
type InventoryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_INVENTORY'; payload: InventoryStatus[] }
  | { type: 'SET_TRANSACTIONS'; payload: TransactionWithProduct[] }
  | { type: 'SET_SUMMARY'; payload: InventorySummary }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: number }
  | { type: 'ADD_TRANSACTION'; payload: TransactionWithProduct };

// 초기 상태
const initialState: InventoryState = {
  products: [],
  inventory: [],
  transactions: [],
  summary: null,
  loading: false,
  error: null,
};

// 리듀서
const inventoryReducer = (state: InventoryState, action: InventoryAction): InventoryState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_INVENTORY':
      return { ...state, inventory: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'SET_SUMMARY':
      return { ...state, summary: action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? action.payload : p),
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    default:
      return state;
  }
};

// 컨텍스트 타입 정의
interface InventoryContextType extends InventoryState {
  // 데이터 로딩 함수들
  loadProducts: (search?: string) => Promise<void>;
  loadInventory: () => Promise<void>;
  loadTransactions: (params?: any) => Promise<void>;
  loadSummary: () => Promise<void>;
  refreshData: () => Promise<void>;

  // 제품 관리 함수들
  createProduct: (data: CreateProductData) => Promise<Product>;
  updateProduct: (id: number, data: UpdateProductData) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;

  // 거래 처리 함수들
  processInbound: (data: InboundTransactionData) => Promise<void>;
  processOutbound: (data: OutboundTransactionData) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;

  // 유틸리티 함수들
  clearError: () => void;
  getProductById: (id: number) => Product | undefined;
}

// 컨텍스트 생성
const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// 프로바이더 컴포넌트
export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(inventoryReducer, initialState);

  // 에러 처리 헬퍼
  const handleError = useCallback((error: any) => {
    const message = error.response?.data?.message || error.message || '알 수 없는 오류가 발생했습니다.';
    dispatch({ type: 'SET_ERROR', payload: message });
    console.error('Inventory Context Error:', error);
  }, []);

  // 제품 목록 로딩
  const loadProducts = useCallback(async (search?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await productApi.getAll(search);
      dispatch({ type: 'SET_PRODUCTS', payload: response.data.data });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [handleError]);

  // 재고 현황 로딩
  const loadInventory = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await inventoryApi.getCurrent();
      dispatch({ type: 'SET_INVENTORY', payload: response.data.data });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [handleError]);

  // 거래 내역 로딩
  const loadTransactions = useCallback(async (params?: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await transactionApi.getAll(params);
      dispatch({ type: 'SET_TRANSACTIONS', payload: response.data.data });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [handleError]);

  // 요약 정보 로딩
  const loadSummary = useCallback(async () => {
    try {
      const response = await inventoryApi.getSummary();
      dispatch({ type: 'SET_SUMMARY', payload: response.data.data });
    } catch (error) {
      handleError(error);
    }
  }, [handleError]);

  // 전체 데이터 새로고침
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadProducts(),
      loadInventory(),
      loadTransactions(),
      loadSummary(),
    ]);
  }, [loadProducts, loadInventory, loadTransactions, loadSummary]);

  // 제품 생성
  const createProduct = useCallback(async (data: CreateProductData): Promise<Product> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await productApi.create(data);
      const newProduct = response.data.data;
      dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // 재고 현황도 업데이트
      await loadInventory();
      
      return newProduct;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [handleError, loadInventory]);

  // 제품 수정
  const updateProduct = useCallback(async (id: number, data: UpdateProductData): Promise<Product> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await productApi.update(id, data);
      const updatedProduct = response.data.data;
      dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // 재고 현황도 업데이트
      await loadInventory();
      
      return updatedProduct;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [handleError, loadInventory]);

  // 제품 삭제
  const deleteProduct = useCallback(async (id: number): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await productApi.delete(id);
      dispatch({ type: 'DELETE_PRODUCT', payload: id });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // 재고 현황도 업데이트
      await loadInventory();
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [handleError, loadInventory]);

  // 입고 처리
  const processInbound = useCallback(async (data: InboundTransactionData): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await transactionApi.processInbound(data);
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // 관련 데이터 새로고침
      await Promise.all([
        loadInventory(),
        loadTransactions(),
        loadSummary(),
      ]);
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [handleError, loadInventory, loadTransactions, loadSummary]);

  // 출고 처리
  const processOutbound = useCallback(async (data: OutboundTransactionData): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await transactionApi.processOutbound(data);
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // 관련 데이터 새로고침
      await Promise.all([
        loadInventory(),
        loadTransactions(),
        loadSummary(),
      ]);
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [handleError, loadInventory, loadTransactions, loadSummary]);

  // 거래 내역 삭제
  const deleteTransaction = useCallback(async (id: number): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await transactionApi.delete(id);
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // 관련 데이터 새로고침
      await Promise.all([
        loadInventory(),
        loadTransactions(),
        loadSummary(),
      ]);
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [handleError, loadInventory, loadTransactions, loadSummary]);

  // 에러 클리어
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // ID로 제품 찾기
  const getProductById = useCallback((id: number): Product | undefined => {
    return state.products.find(p => p.id === id);
  }, [state.products]);

  // 초기 데이터 로딩
  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contextValue: InventoryContextType = {
    ...state,
    loadProducts,
    loadInventory,
    loadTransactions,
    loadSummary,
    refreshData,
    createProduct,
    updateProduct,
    deleteProduct,
    processInbound,
    processOutbound,
    deleteTransaction,
    clearError,
    getProductById,
  };

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};

// 커스텀 훅
export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};