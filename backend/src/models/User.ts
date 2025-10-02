export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'admin' | 'user';
  is_active: number;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: 'admin' | 'user';
}

export interface LoginDTO {
  username: string;
  password: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  is_active: number;
  last_login?: string;
  created_at: string;
}
