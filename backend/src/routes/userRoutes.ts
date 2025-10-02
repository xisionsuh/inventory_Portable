import { Router } from 'express';
import { AuthService } from '../services/AuthService';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const authService = new AuthService();

// 모든 사용자 조회 (관리자 전용)
router.get('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const users = await authService.getAllUsers();
  res.json({ users });
}));

// 특정 사용자 조회
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);

  // 자신의 정보이거나 관리자만 조회 가능
  if (req.user!.id !== userId && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const user = await authService.getUserById(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user });
}));

// 사용자 정보 수정
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);

  // 자신의 정보이거나 관리자만 수정 가능
  if (req.user!.id !== userId && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // 일반 사용자는 role 변경 불가
  if (req.user!.role !== 'admin' && req.body.role) {
    delete req.body.role;
  }

  const user = await authService.updateUser(userId, req.body);
  res.json({ message: 'User updated successfully', user });
}));

// 사용자 삭제 (비활성화) - 관리자 전용
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);

  // 자기 자신은 삭제 불가
  if (req.user!.id === userId) {
    res.status(400).json({ error: 'Cannot delete yourself' });
    return;
  }

  await authService.deleteUser(userId);
  res.json({ message: 'User deleted successfully' });
}));

export default router;
