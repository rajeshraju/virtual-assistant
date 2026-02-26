import api from './axiosInstance';
import type { Appointment } from '../types';

export const getAppointments = (start?: string, end?: string) =>
  api.get<Appointment[]>('/appointments', { params: { start, end } }).then(r => r.data);

export const getAppointment = (id: string) =>
  api.get<Appointment>(`/appointments/${id}`).then(r => r.data);

export const createAppointment = (data: Partial<Appointment>) =>
  api.post<Appointment>('/appointments', data).then(r => r.data);

export const updateAppointment = (id: string, data: Partial<Appointment>) =>
  api.put<Appointment>(`/appointments/${id}`, data).then(r => r.data);

export const deleteAppointment = (id: string) =>
  api.delete(`/appointments/${id}`);

export const rescheduleAppointment = (id: string, startTime: string, endTime: string) =>
  api.post<Appointment>(`/appointments/${id}/reschedule`, { startTime, endTime }).then(r => r.data);

export const sendReminder = (id: string) =>
  api.post(`/appointments/${id}/send-reminder`).then(r => r.data);
