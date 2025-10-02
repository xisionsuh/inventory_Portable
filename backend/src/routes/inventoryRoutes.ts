import { Router } from 'express';
import { InventoryService } from '../services/InventoryService';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { validateIdParam, validateNumber } from '../middleware/validation';

const router = Router();
const inventoryService = new InventoryService();

// GET /api/inventory/current - 현재 재고 현황 조회
router.get('/current', asyncHandler(async (req, res) => {
  const inventory = await inventoryService.getCurrentInventory();

  res.json({
    success: true,
    data: inventory,
    count: inventory.length
  });
}));

// GET /api/inventory/summary - 재고 요약 정보 조회
router.get('/summary', asyncHandler(async (req, res) => {
  const summary = await inventoryService.getInventorySummary();

  res.json({
    success: true,
    data: summary
  });
}));

// GET /api/inventory/low-stock - 재고 부족 제품 조회
router.get('/low-stock', asyncHandler(async (req, res) => {
  const lowStockProducts = await inventoryService.getLowStockProducts();

  res.json({
    success: true,
    data: lowStockProducts,
    count: lowStockProducts.length
  });
}));

// GET /api/inventory/out-of-stock - 재고 없는 제품 조회
router.get('/out-of-stock', asyncHandler(async (req, res) => {
  const outOfStockProducts = await inventoryService.getOutOfStockProducts();

  res.json({
    success: true,
    data: outOfStockProducts,
    count: outOfStockProducts.length
  });
}));

// GET /api/inventory/movements/:productId - 제품별 재고 이동 내역
router.get('/movements/:productId', validateIdParam, asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId);
  const { days } = req.query;

  const daysNum = days ? validateNumber(days, '조회 일수', 1, 365) : 30;
  const movements = await inventoryService.getStockMovements(productId, daysNum);

  res.json({
    success: true,
    data: movements,
    count: movements.length,
    period_days: daysNum
  });
}));

// GET /api/inventory/turnover - 재고 회전율 조회
router.get('/turnover', asyncHandler(async (req, res) => {
  const { product_id } = req.query;

  const productId = product_id ? validateNumber(product_id, '제품 ID', 1) : undefined;
  const turnoverData = await inventoryService.getStockTurnover(productId);

  res.json({
    success: true,
    data: turnoverData,
    count: turnoverData.length,
    period: '최근 30일'
  });
}));

// GET /api/inventory/status/:productId - 특정 제품의 재고 상태 조회
router.get('/status/:productId', validateIdParam, asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId);
  
  const inventory = await inventoryService.getCurrentInventory();
  const product = inventory.find(p => p.id === productId);

  if (!product) {
    throw new AppError('제품을 찾을 수 없습니다.', 404);
  }

  // 재고 이동 내역도 함께 조회
  const movements = await inventoryService.getStockMovements(productId, 7);
  const turnover = await inventoryService.getStockTurnover(productId);

  res.json({
    success: true,
    data: {
      product,
      recent_movements: movements,
      turnover_info: turnover[0] || null
    }
  });
}));

export default router;