import api from './axiosInstance';
import type { EmailRule, EmailLog, PhoneCall, PaginatedResponse } from '../types';

export const getEmailRules = () =>
  api.get<EmailRule[]>('/email-rules').then(r => r.data);

export const createEmailRule = (data: Partial<EmailRule>) =>
  api.post<EmailRule>('/email-rules', data).then(r => r.data);

export const updateEmailRule = (id: string, data: Partial<EmailRule>) =>
  api.put<EmailRule>(`/email-rules/${id}`, data).then(r => r.data);

export const deleteEmailRule = (id: string) =>
  api.delete(`/email-rules/${id}`);

export const toggleEmailRule = (id: string) =>
  api.patch(`/email-rules/${id}/toggle`);

export const getEmailLogs = (page = 1, pageSize = 20) =>
  api.get<PaginatedResponse<EmailLog>>('/email-logs', { params: { page, pageSize } }).then(r => r.data);

export const getPhoneCalls = (page = 1, pageSize = 20) =>
  api.get<PaginatedResponse<PhoneCall>>('/calls', { params: { page, pageSize } }).then(r => r.data);
