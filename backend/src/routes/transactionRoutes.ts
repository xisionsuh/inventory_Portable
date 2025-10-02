import { Router } from 'express';
import { TransactionService } from '../services/TransactionService';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { validateRequestBody, validateIdParam, validateString, validateNumber, validateDate } from '../middleware/validation';

const router = Router();
const transactionService = new TransactionService();

// GET /api/transactions - 모든 거래 내역 조회
router.get('/', asyncHandler(async (req, res) => {
  const { product_id, type, start_date, end_date } = req.query;

  let transactions;

  if (start_date && end_date) {
    // 날짜 범위로 조회
    const validStartDate = validateDate(start_date, '시작 날짜');
    const validEndDate = validateDate(end_date, '종료 날짜');
    transactions = await transactionService.getTransactionsByDateRange(validStartDate, validEndDate);
  } else if (product_id) {
    // 제품별 조회
    const productIdNum = validateNumber(product_id, '제품 ID', 1);
    transactions = await transactionService.getTransactionsByProductId(productIdNum);
  } else if (type && (type === 'INBOUND' || type === 'OUTBOUND')) {
    // 거래 유형별 조회
    transactions = await transactionService.getTransactionsByType(type);
  } else {
    // 전체 조회
    transactions = await transactionService.getAllTransactions();
  }

  res.json({
    success: true,
    data: transactions,
    count: transactions.length
  });
}));

// GET /api/transactions/:id - 특정 거래 내역 조회
router.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const transaction = await transactionService.getTransactionById(id);

  if (!transaction) {
    throw new AppError('거래 내역을 찾을 수 없습니다.', 404);
  }

  res.json({
    success: true,
    data: transaction
  });
}));

// POST /api/transactions/inbound - 입고 등록
router.post('/inbound',
  validateRequestBody(['product_id', 'quantity', 'transaction_date']),
  asyncHandler(async (req, res) => {
    const { product_id, quantity, unit_price, supplier, transaction_date } = req.body;

    // 입력 데이터 유효성 검사
    const inboundData = {
      product_id: validateNumber(product_id, '제품 ID', 1),
      quantity: validateNumber(quantity, '수량', 1),
      unit_price: unit_price !== undefined ? validateNumber(unit_price, '단가', 0) : undefined,
      supplier: supplier ? validateString(supplier, '공급업체', 1, 200) : undefined,
      transaction_date: validateDate(transaction_date, '입고 날짜')
    };

    const newTransaction = await transactionService.processInbound(inboundData);

    res.status(201).json({
      success: true,
      message: '입고가 성공적으로 처리되었습니다.',
      data: newTransaction
    });
  })
);

// POST /api/transactions/outbound - 출고 등록
router.post('/outbound',
  validateRequestBody(['product_id', 'quantity', 'transaction_date']),
  asyncHandler(async (req, res) => {
    const { product_id, quantity, reason, transaction_date } = req.body;

    // 입력 데이터 유효성 검사
    const outboundData = {
      product_id: validateNumber(product_id, '제품 ID', 1),
      quantity: validateNumber(quantity, '수량', 1),
      reason: reason ? validateString(reason, '출고 사유', 1, 200) : undefined,
      transaction_date: validateDate(transaction_date, '출고 날짜')
    };

    const newTransaction = await transactionService.processOutbound(outboundData);

    res.status(201).json({
      success: true,
      message: '출고가 성공적으로 처리되었습니다.',
      data: newTransaction
    });
  })
);

// DELETE /api/transactions/:id - 거래 내역 삭제 (관리자용)
router.delete('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  await transactionService.deleteTransaction(id);

  res.json({
    success: true,
    message: '거래 내역이 성공적으로 삭제되었습니다.'
  });
}));

// GET /api/transactions/product/:productId - 특정 제품의 거래 내역 조회
router.get('/product/:productId', validateIdParam, asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId);
  const transactions = await transactionService.getTransactionsByProductId(productId);

  res.json({
    success: true,
    data: transactions,
    count: transactions.length
  });
}));

// GET /api/transactions/type/:type - 거래 유형별 조회
router.get('/type/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;

  if (type !== 'INBOUND' && type !== 'OUTBOUND') {
    throw new AppError('유효하지 않은 거래 유형입니다. (INBOUND 또는 OUTBOUND)', 400);
  }

  const transactions = await transactionService.getTransactionsByType(type);

  res.json({
    success: true,
    data: transactions,
    count: transactions.length
  });
}));

export default router;