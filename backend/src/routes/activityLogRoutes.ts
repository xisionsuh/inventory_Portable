import { Router } from 'express';
import { ActivityLogService } from '../services/ActivityLogService';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const activityLogService = new ActivityLogService();

// 모든 로그 조회 (관리자 전용)
router.get('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = parseInt(req.query.offset as string) || 0;

  const logs = await activityLogService.getAllLogs(limit, offset);
  res.json({ logs, limit, offset });
}));

// 필터링된 로그 조회 (관리자 전용)
router.get('/filter', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const filters = {
    userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
    actionType: req.query.actionType as string,
    tableName: req.query.tableName as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0
  };

  const result = await activityLogService.getFilteredLogs(filters);
  res.json(result);
}));

// 사용자별 로그 조회
router.get('/user/:userId', authenticate, asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const limit = parseInt(req.query.limit as string) || 100;

  // 자신의 로그이거나 관리자만 조회 가능
  if (req.user!.id !== userId && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const logs = await activityLogService.getLogsByUser(userId, limit);
  res.json({ logs });
}));

// 테이블별 로그 조회 (관리자 전용)
router.get('/table/:tableName', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const tableName = req.params.tableName;
  const recordId = req.query.recordId ? parseInt(req.query.recordId as string) : undefined;

  const logs = await activityLogService.getLogsByTable(tableName, recordId);
  res.json({ logs });
}));

// 날짜 범위별 로그 조회 (관리자 전용)
router.get('/date-range', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  if (!startDate || !endDate) {
    res.status(400).json({ error: 'startDate and endDate are required' });
    return;
  }

  const logs = await activityLogService.getLogsByDateRange(startDate, endDate);
  res.json({ logs });
}));

export default router;
