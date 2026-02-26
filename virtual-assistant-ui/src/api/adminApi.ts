import api from './axiosInstance';
import type { User } from '../types';

// ── User management ──────────────────────────────────────────────────────────

export interface AdminUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  password?: string;
  role: 'Admin' | 'Staff';
  canViewEmails: boolean;
  canViewCalls: boolean;
  canViewScheduling: boolean;
}

export const listUsers = (): Promise<User[]> =>
  api.get('/admin/users').then(r => r.data);

export const createUser = (body: AdminUserRequest): Promise<User> =>
  api.post('/admin/users', body).then(r => r.data);

export const updateUser = (id: string, body: AdminUserRequest): Promise<User> =>
  api.put(`/admin/users/${id}`, body).then(r => r.data);

export const deleteUser = (id: string): Promise<void> =>
  api.delete(`/admin/users/${id}`);

export const resetPassword = (id: string, newPassword: string): Promise<void> =>
  api.post(`/admin/users/${id}/reset-password`, { newPassword });

// ── Settings ─────────────────────────────────────────────────────────────────

export interface SystemSettings {
  twilio: {
    accountSid: string;
    authToken: string;
    fromPhoneNumber: string;
    publicBaseUrl: string;
  };
  sendGrid: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  imap: {
    host: string;
    port: number;
    useSsl: boolean;
    username: string;
    password: string;
    pollIntervalMinutes: number;
  };
}

export const getSettings = (): Promise<SystemSettings> =>
  api.get('/settings').then(r => r.data);

export const saveSettings = (body: SystemSettings): Promise<void> =>
  api.put('/settings', body);
