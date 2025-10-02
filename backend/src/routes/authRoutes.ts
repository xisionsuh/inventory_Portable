import { Router } from 'express';
import { AuthService } from '../services/AuthService';
import { ActivityLogService } from '../services/ActivityLogService';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const authService = new AuthService();
const activityLogService = new ActivityLogService();

// 회원가입
router.post('/register', asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);

  res.status(201).json({
    message: 'User registered successfully',
    user
  });
}));

// 로그인
router.post('/login', asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);

  // 쿠키에 토큰 저장
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
  });

  // 로그인 로그 기록
  await activityLogService.createLog({
    user_id: user.id,
    action_type: 'LOGIN',
    table_name: 'users',
    record_id: user.id,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  res.json({
    message: 'Login successful',
    user,
    token
  });
}));

// 로그아웃
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  // 로그아웃 로그 기록
  if (req.user) {
    await activityLogService.createLog({
      user_id: req.user.id,
      action_type: 'LOGOUT',
      table_name: 'users',
      record_id: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });
  }

  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
}));

// 현재 사용자 정보 조회
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user!.id);
  res.json({ user });
}));

// 토큰 갱신
router.post('/refresh', authenticate, asyncHandler(async (req, res) => {
  // 새 토큰 발급
  const { user, token } = await authService.login({
    username: req.user!.username,
    password: '' // 이미 인증된 사용자이므로 비밀번호 체크 생략
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ token });
}));

export default router;
