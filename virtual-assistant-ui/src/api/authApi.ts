import api from './axiosInstance';
import type { User } from '../types';

export interface AuthResponse { token: string; user: User }

export const register = (data: { email: string; password: string; firstName: string; lastName: string; phoneNumber?: string }) =>
  api.post<AuthResponse>('/auth/register', data).then(r => r.data);

export const login = (data: { email: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', data).then(r => r.data);

export const getMe = () =>
  api.get<User>('/auth/me').then(r => r.data);

export const updateMe = (data: { firstName?: string; lastName?: string; phoneNumber?: string }) =>
  api.put<User>('/auth/me', data).then(r => r.data);
