import { Router } from 'express';
import { BackupService } from '../services/BackupService';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const backupService = new BackupService();

// 백업 생성
router.post('/create', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const backupPath = await backupService.createBackup(reason);

  res.json({
    message: 'Backup created successfully',
    backup_path: backupPath
  });
}));

// 백업 목록 조회
router.get('/list', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const backups = await backupService.listBackups();

  res.json({
    backups,
    backup_directory: backupService.getBackupDirectory()
  });
}));

// 백업 복구
router.post('/restore', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { filename } = req.body;

  if (!filename) {
    res.status(400).json({ error: 'Filename is required' });
    return;
  }

  await backupService.restoreBackup(filename);

  res.json({
    message: 'Backup restored successfully',
    filename
  });
}));

// 오래된 백업 정리
router.post('/cleanup', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const daysToKeep = parseInt(req.body.days_to_keep) || 30;
  const deletedCount = await backupService.cleanOldBackups(daysToKeep);

  res.json({
    message: 'Old backups cleaned up successfully',
    deleted_count: deletedCount
  });
}));

// 백업 삭제
router.delete('/:filename', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { filename } = req.params;
  await backupService.deleteBackup(filename);

  res.json({
    message: 'Backup deleted successfully',
    filename
  });
}));

export default router;
