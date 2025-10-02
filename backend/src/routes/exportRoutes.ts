import { Router } from 'express';
import multer from 'multer';
import { ExcelService } from '../services/ExcelService';
import { ProductService } from '../services/ProductService';
import { TransactionService } from '../services/TransactionService';
import { InventoryService } from '../services/InventoryService';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { validateDate } from '../middleware/validation';

const router = Router();
const excelService = new ExcelService();
const productService = new ProductService();
const transactionService = new TransactionService();
const inventoryService = new InventoryService();

// 파일 업로드 설정
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('엑셀 파일만 업로드 가능합니다.'));
    }
  }
});

// GET /api/export/products - 제품 목록 엑셀 다운로드
router.get('/products', asyncHandler(async (req, res) => {
  const { search } = req.query;
  
  let products;
  if (search && typeof search === 'string') {
    products = await productService.searchProducts(search);
  } else {
    products = await productService.getAllProducts();
  }

  const excelBuffer = await excelService.exportProducts(products);
  const fileName = excelService.generateFileName('products');

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.setHeader('Content-Length', excelBuffer.length);

  res.send(excelBuffer);
}));

// GET /api/export/inventory - 재고 현황 엑셀 다운로드
router.get('/inventory', asyncHandler(async (req, res) => {
  const inventory = await inventoryService.getCurrentInventory();
  const excelBuffer = await excelService.exportInventory(inventory);
  const fileName = excelService.generateFileName('inventory');

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.setHeader('Content-Length', excelBuffer.length);

  res.send(excelBuffer);
}));

// GET /api/export/transactions - 거래 내역 엑셀 다운로드
router.get('/transactions', asyncHandler(async (req, res) => {
  const { start_date, end_date, type } = req.query;

  let transactions;

  if (start_date && end_date) {
    // 날짜 범위로 조회
    const validStartDate = validateDate(start_date, '시작 날짜');
    const validEndDate = validateDate(end_date, '종료 날짜');
    transactions = await transactionService.getTransactionsByDateRange(validStartDate, validEndDate);
  } else if (type && (type === 'INBOUND' || type === 'OUTBOUND')) {
    // 거래 유형별 조회
    transactions = await transactionService.getTransactionsByType(type);
  } else {
    // 전체 조회
    transactions = await transactionService.getAllTransactions();
  }

  let excelBuffer: Buffer;
  let fileType: string;

  if (type === 'INBOUND') {
    excelBuffer = await excelService.exportInboundTransactions(transactions);
    fileType = 'inbound';
  } else if (type === 'OUTBOUND') {
    excelBuffer = await excelService.exportOutboundTransactions(transactions);
    fileType = 'outbound';
  } else {
    excelBuffer = await excelService.exportTransactions(transactions);
    fileType = 'transactions';
  }

  const fileName = excelService.generateFileName(fileType);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.setHeader('Content-Length', excelBuffer.length);

  res.send(excelBuffer);
}));

// GET /api/export/low-stock - 재고 부족 제품 엑셀 다운로드
router.get('/low-stock', asyncHandler(async (req, res) => {
  const lowStockProducts = await inventoryService.getLowStockProducts();
  const excelBuffer = await excelService.exportLowStockProducts(lowStockProducts);
  const fileName = excelService.generateFileName('low-stock');

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.setHeader('Content-Length', excelBuffer.length);

  res.send(excelBuffer);
}));

// GET /api/export/transactions/inbound - 입고 내역만 엑셀 다운로드
router.get('/transactions/inbound', asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  let transactions;
  if (start_date && end_date) {
    const validStartDate = validateDate(start_date, '시작 날짜');
    const validEndDate = validateDate(end_date, '종료 날짜');
    transactions = await transactionService.getTransactionsByDateRange(validStartDate, validEndDate);
  } else {
    transactions = await transactionService.getTransactionsByType('INBOUND');
  }

  const excelBuffer = await excelService.exportInboundTransactions(transactions);
  const fileName = excelService.generateFileName('inbound');

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.setHeader('Content-Length', excelBuffer.length);

  res.send(excelBuffer);
}));

// GET /api/export/transactions/outbound - 출고 내역만 엑셀 다운로드
router.get('/transactions/outbound', asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  let transactions;
  if (start_date && end_date) {
    const validStartDate = validateDate(start_date, '시작 날짜');
    const validEndDate = validateDate(end_date, '종료 날짜');
    transactions = await transactionService.getTransactionsByDateRange(validStartDate, validEndDate);
  } else {
    transactions = await transactionService.getTransactionsByType('OUTBOUND');
  }

  const excelBuffer = await excelService.exportOutboundTransactions(transactions);
  const fileName = excelService.generateFileName('outbound');

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.setHeader('Content-Length', excelBuffer.length);

  res.send(excelBuffer);
}));

// POST /api/export/custom - 커스텀 조건으로 엑셀 다운로드
router.post('/custom', asyncHandler(async (req, res) => {
  const { 
    export_type, 
    start_date, 
    end_date, 
    product_ids, 
    transaction_type,
    include_low_stock_only 
  } = req.body;

  if (!export_type || !['products', 'transactions', 'inventory'].includes(export_type)) {
    throw new AppError('유효하지 않은 내보내기 유형입니다.', 400);
  }

  let excelBuffer: Buffer;
  let fileName: string;

  switch (export_type) {
    case 'products':
      let products = await productService.getAllProducts();
      
      if (product_ids && Array.isArray(product_ids)) {
        products = products.filter(p => product_ids.includes(p.id));
      }
      
      if (include_low_stock_only) {
        const lowStockProducts = await productService.getLowStockProducts();
        const lowStockIds = lowStockProducts.map(p => p.id);
        products = products.filter(p => lowStockIds.includes(p.id));
      }
      
      excelBuffer = await excelService.exportProducts(products);
      fileName = excelService.generateFileName('products');
      break;

    case 'transactions':
      let transactions;
      
      if (start_date && end_date) {
        const validStartDate = validateDate(start_date, '시작 날짜');
        const validEndDate = validateDate(end_date, '종료 날짜');
        transactions = await transactionService.getTransactionsByDateRange(validStartDate, validEndDate);
      } else {
        transactions = await transactionService.getAllTransactions();
      }
      
      if (product_ids && Array.isArray(product_ids)) {
        transactions = transactions.filter(t => product_ids.includes(t.product_id));
      }
      
      if (transaction_type && ['INBOUND', 'OUTBOUND'].includes(transaction_type)) {
        transactions = transactions.filter(t => t.type === transaction_type);
      }
      
      excelBuffer = await excelService.exportTransactions(transactions);
      fileName = excelService.generateFileName('transactions');
      break;

    case 'inventory':
      let inventory = await inventoryService.getCurrentInventory();
      
      if (product_ids && Array.isArray(product_ids)) {
        inventory = inventory.filter(i => product_ids.includes(i.id));
      }
      
      if (include_low_stock_only) {
        inventory = inventory.filter(i => i.is_low_stock);
      }
      
      excelBuffer = await excelService.exportInventory(inventory);
      fileName = excelService.generateFileName('inventory');
      break;

    default:
      throw new AppError('지원하지 않는 내보내기 유형입니다.', 400);
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.setHeader('Content-Length', excelBuffer.length);

  res.send(excelBuffer);
}));

// GET /api/export/template/products - 제품 등록 템플릿 다운로드
router.get('/template/products', asyncHandler(async (req, res) => {
  const excelBuffer = await excelService.createProductTemplate();
  const fileName = excelService.generateFileName('product-template');

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.send(excelBuffer);
}));

// GET /api/export/template/inbound - 입고 등록 템플릿 다운로드
router.get('/template/inbound', asyncHandler(async (req, res) => {
  const excelBuffer = await excelService.createInboundTemplate();
  const fileName = excelService.generateFileName('inbound-template');

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.send(excelBuffer);
}));

// GET /api/export/template/outbound - 출고 등록 템플릿 다운로드
router.get('/template/outbound', asyncHandler(async (req, res) => {
  const excelBuffer = await excelService.createOutboundTemplate();
  const fileName = excelService.generateFileName('outbound-template');

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.send(excelBuffer);
}));

// POST /api/export/upload/products - 제품 엑셀 업로드
router.post('/upload/products', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('파일이 업로드되지 않았습니다.', 400);
  }

  const products = excelService.parseProductsFromExcel(req.file.buffer);

  if (products.length === 0) {
    throw new AppError('업로드된 파일에 데이터가 없습니다.', 400);
  }

  // 제품 등록
  const results = {
    success: [],
    failed: []
  };

  for (const product of products) {
    try {
      const createdProduct = await productService.createProduct(product);
      results.success.push({ ...product, id: createdProduct.id });
    } catch (error: any) {
      results.failed.push({ ...product, error: error.message });
    }
  }

  res.json({
    message: '제품 업로드 완료',
    total: products.length,
    success_count: results.success.length,
    failed_count: results.failed.length,
    results
  });
}));

// POST /api/export/upload/inbound - 입고 엑셀 업로드
router.post('/upload/inbound', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('파일이 업로드되지 않았습니다.', 400);
  }

  const transactions = excelService.parseInboundFromExcel(req.file.buffer);

  if (transactions.length === 0) {
    throw new AppError('업로드된 파일에 데이터가 없습니다.', 400);
  }

  const results = {
    success: [],
    failed: []
  };

  for (const transaction of transactions) {
    try {
      // 제품 조회
      const product = await productService.getProductByCode(
        transaction.internal_code,
        transaction.unique_code
      );

      if (!product) {
        throw new Error(`제품을 찾을 수 없습니다: ${transaction.internal_code}`);
      }

      // 입고 처리
      const createdTransaction = await transactionService.processInbound({
        product_id: product.id,
        transaction_date: transaction.transaction_date,
        quantity: transaction.quantity,
        unit_price: transaction.unit_price,
        supplier: transaction.supplier
      });

      results.success.push({ ...transaction, id: createdTransaction.id });
    } catch (error: any) {
      results.failed.push({ ...transaction, error: error.message });
    }
  }

  res.json({
    message: '입고 업로드 완료',
    total: transactions.length,
    success_count: results.success.length,
    failed_count: results.failed.length,
    results
  });
}));

// POST /api/export/upload/outbound - 출고 엑셀 업로드
router.post('/upload/outbound', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('파일이 업로드되지 않았습니다.', 400);
  }

  const transactions = excelService.parseOutboundFromExcel(req.file.buffer);

  if (transactions.length === 0) {
    throw new AppError('업로드된 파일에 데이터가 없습니다.', 400);
  }

  const results = {
    success: [],
    failed: []
  };

  for (const transaction of transactions) {
    try {
      // 제품 조회
      const product = await productService.getProductByCode(
        transaction.internal_code,
        transaction.unique_code
      );

      if (!product) {
        throw new Error(`제품을 찾을 수 없습니다: ${transaction.internal_code}`);
      }

      // 출고 처리
      const createdTransaction = await transactionService.processOutbound({
        product_id: product.id,
        transaction_date: transaction.transaction_date,
        quantity: transaction.quantity,
        reason: transaction.reason
      });

      results.success.push({ ...transaction, id: createdTransaction.id });
    } catch (error: any) {
      results.failed.push({ ...transaction, error: error.message });
    }
  }

  res.json({
    message: '출고 업로드 완료',
    total: transactions.length,
    success_count: results.success.length,
    failed_count: results.failed.length,
    results
  });
}));

export default router;