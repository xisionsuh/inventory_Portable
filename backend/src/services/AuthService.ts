import { db } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, CreateUserDTO, LoginDTO, UserResponse } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'inventory-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export class AuthService {
  // 사용자 등록
  async register(data: CreateUserDTO): Promise<UserResponse> {
    // 중복 체크
    const existingUser = await db.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [data.username, data.email]
    );

    if (existingUser) {
      throw new Error('Username or email already exists');
    }

    // 비밀번호 해싱
    const password_hash = await bcrypt.hash(data.password, 10);

    // 사용자 생성
    const result = await db.run(
      `INSERT INTO users (username, email, password_hash, full_name, role)
       VALUES (?, ?, ?, ?, ?)`,
      [data.username, data.email, password_hash, data.full_name, data.role || 'user']
    );

    const user = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
    return this.toUserResponse(user);
  }

  // 로그인
  async login(data: LoginDTO): Promise<{ user: UserResponse; token: string }> {
    const user = await db.get(
      'SELECT * FROM users WHERE username = ?',
      [data.username]
    ) as User;

    if (!user || !user.is_active) {
      throw new Error('Invalid credentials');
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // 마지막 로그인 시간 업데이트
    await db.run(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      user: this.toUserResponse(user),
      token
    };
  }

  // 토큰 검증
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // 사용자 정보 조회
  async getUserById(id: number): Promise<UserResponse | null> {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    return user ? this.toUserResponse(user) : null;
  }

  // 모든 사용자 조회 (관리자 전용)
  async getAllUsers(): Promise<UserResponse[]> {
    const users = await db.all('SELECT * FROM users ORDER BY created_at DESC');
    return users.map(user => this.toUserResponse(user));
  }

  // 사용자 업데이트
  async updateUser(id: number, data: Partial<CreateUserDTO>): Promise<UserResponse> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.email) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.full_name) {
      updates.push('full_name = ?');
      values.push(data.full_name);
    }
    if (data.role) {
      updates.push('role = ?');
      values.push(data.role);
    }
    if (data.password) {
      updates.push('password_hash = ?');
      values.push(await bcrypt.hash(data.password, 10));
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    return this.toUserResponse(user);
  }

  // 사용자 삭제 (비활성화)
  async deleteUser(id: number): Promise<void> {
    await db.run('UPDATE users SET is_active = 0 WHERE id = ?', [id]);
  }

  // User를 UserResponse로 변환 (비밀번호 제거)
  private toUserResponse(user: any): UserResponse {
    const { password_hash, ...userResponse } = user;
    return userResponse;
  }
}
