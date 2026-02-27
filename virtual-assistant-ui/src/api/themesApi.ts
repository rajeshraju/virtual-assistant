import api from './axiosInstance';
import type { Theme } from '../types';

export const getThemes = (): Promise<Theme[]> =>
  api.get<Theme[]>('/themes').then(r => r.data);

export const getActiveTheme = (): Promise<Theme | null> =>
  api.get<Theme | null>('/themes/active').then(r => r.data);

export const createTheme = (data: ThemeFormData): Promise<Theme> =>
  api.post<Theme>('/themes', data).then(r => r.data);

export const updateTheme = (id: string, data: ThemeFormData): Promise<Theme> =>
  api.put<Theme>(`/themes/${id}`, data).then(r => r.data);

export const deleteTheme = (id: string): Promise<void> =>
  api.delete(`/themes/${id}`).then(() => undefined);

export const activateTheme = (id: string): Promise<Theme> =>
  api.post<Theme>(`/themes/${id}/activate`).then(r => r.data);

export interface ThemeFormData {
  name: string;
  slug: string;
  isDark: boolean;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  sidebarBg: string;
  sidebarActive: string;
  sidebarHover: string;
  sidebarText: string;
  sidebarSubtext: string;
  sidebarBorder: string;
  pageBg: string;
  cardBg: string;
  textPrimary: string;
  textMuted: string;
  borderColor: string;
  tableHeaderBg: string;
  inputBg: string;
}

export const emptyThemeForm = (): ThemeFormData => ({
  name: '',
  slug: '',
  isDark: false,
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#eff6ff',
  sidebarBg: '#111827',
  sidebarActive: '#2563eb',
  sidebarHover: '#1f2937',
  sidebarText: '#d1d5db',
  sidebarSubtext: '#9ca3af',
  sidebarBorder: 'rgba(255,255,255,0.1)',
  pageBg: '#f9fafb',
  cardBg: '#ffffff',
  textPrimary: '#111827',
  textMuted: '#6b7280',
  borderColor: '#e5e7eb',
  tableHeaderBg: '#f9fafb',
  inputBg: '#ffffff',
});
