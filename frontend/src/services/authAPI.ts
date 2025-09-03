import apiClient from './api';
import { User } from '../store/slices/authSlice';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  email?: string;
  avatar?: string;
}

export const authAPI = {
  // 登录
  login: (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/auth/login', credentials)
      .then(response => response.data);
  },

  // 注册
  register: (userData: RegisterRequest): Promise<User> => {
    return apiClient.post<User>('/auth/register', userData)
      .then(response => response.data);
  },

  // 登出
  logout: (): Promise<void> => {
    return apiClient.post('/auth/logout').then(() => {});
  },

  // 获取当前用户信息
  getCurrentUser: (): Promise<User> => {
    return apiClient.get<User>('/auth/me')
      .then(response => response.data);
  },

  // 刷新token
  refreshToken: (refreshToken: string): Promise<{ token: string; expiresIn: number }> => {
    return apiClient.post('/auth/refresh', { refreshToken })
      .then(response => response.data);
  },

  // 修改密码
  changePassword: (data: ChangePasswordRequest): Promise<void> => {
    return apiClient.post('/auth/change-password', data).then(() => {});
  },

  // 重置密码
  resetPassword: (data: ResetPasswordRequest): Promise<void> => {
    return apiClient.post('/auth/reset-password', data).then(() => {});
  },

  // 更新个人资料
  updateProfile: (data: UpdateProfileRequest): Promise<User> => {
    return apiClient.patch<User>('/auth/profile', data)
      .then(response => response.data);
  },

  // 上传头像
  uploadAvatar: (file: File): Promise<{ avatarUrl: string }> => {
    return apiClient.upload<{ avatarUrl: string }>('/auth/avatar', file)
      .then(response => response.data);
  },

  // 验证token
  verifyToken: (token: string): Promise<{ valid: boolean; user?: User }> => {
    return apiClient.post('/auth/verify-token', { token })
      .then(response => response.data);
  },

  // 获取用户权限
  getUserPermissions: (): Promise<string[]> => {
    return apiClient.get<string[]>('/auth/permissions')
      .then(response => response.data);
  },
};
