/**
 * API Service — central Axios instance for all backend calls.
 *
 * Base URL points to your local Express server.
 * On Android emulator use http://10.0.2.2:3000
 * On iOS simulator / real device use http://localhost:3000 or your machine's LAN IP.
 */
import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ─── Config ───────────────────────────────────────────────────────────────────
/**
 * Dynamically resolves the API Base URL:
 * 1. Uses explicit EXPO_PUBLIC_API_URL if set in .env
 * 2. On Web, defaults to http://localhost:3000
 * 3. On mobile (Expo Go / standalone dev client), dynamically extracts host machine IP from Expo Constants
 * 4. Fallback: http://10.0.2.2:3000 for Android emulator, http://localhost:3000 for iOS simulator
 */
const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.developer?.tool;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3000`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
};

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Auth token interceptor ───────────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('xpense_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // SecureStore unavailable (web) — skip
  }
  return config;
});

// ─── Error normaliser ─────────────────────────────────────────────────────────
function extractMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (err as AxiosError<{ message: string }>).response?.data?.message ?? err.message;
  }
  return 'An unexpected error occurred';
}

// ─── Auth endpoints ───────────────────────────────────────────────────────────
export const authApi = {
  async register(payload: { email: string; phone: string; name: string; password: string; currency?: string }) {
    try {
      const { data } = await api.post('/api/auth/register', payload);
      return data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },

  async login(payload: { identifier: string; password: string }) {
    try {
      const { data } = await api.post('/api/auth/login', payload);
      return data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },

  async googleAuth(payload: { idToken?: string; accessToken?: string; email?: string; name?: string }) {
    try {
      const { data } = await api.post('/api/auth/google', payload);
      return data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },

  async me() {
    try {
      const { data } = await api.get('/api/auth/me');
      return data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },

  async updateProfile(payload: { name?: string; currency?: string }) {
    try {
      const { data } = await api.put('/api/auth/profile', payload);
      return data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },

  async changePassword(payload: { currentPassword: string; newPassword: string }) {
    try {
      const { data } = await api.put('/api/auth/change-password', payload);
      return data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },

  async forgotPassword(payload: { email: string }) {
    try {
      const { data } = await api.post('/api/auth/forgot-password', payload);
      return data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },

  async resetPasswordOtp(payload: { email: string; otp: string; newPassword: string }) {
    try {
      const { data } = await api.post('/api/auth/reset-password-otp', payload);
      return data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
};

// ─── Transaction endpoints ────────────────────────────────────────────────────
export const transactionsApi = {
  async list(params?: { month?: number; year?: number; type?: string; limit?: number }) {
    const { data } = await api.get('/api/transactions', { params });
    return data;
  },
  async summary(params?: { month?: number; year?: number }) {
    const { data } = await api.get('/api/transactions/summary', { params });
    return data;
  },
  async create(payload: {
    categoryId: string;
    type: string;
    amount: number;
    note?: string;
    date?: string;
    categoryName?: string;
    categoryIcon?: string;
    categoryColor?: string;
  }) {
    const { data } = await api.post('/api/transactions', payload);
    return data;
  },
  async update(id: string, payload: Partial<{ categoryId: string; type: string; amount: number; note: string; date: string }>) {
    const { data } = await api.put(`/api/transactions/${id}`, payload);
    return data;
  },
  async remove(id: string) {
    const { data } = await api.delete(`/api/transactions/${id}`);
    return data;
  },
  async removeAll() {
    const { data } = await api.delete('/api/transactions/all');
    return data;
  },
};

// ─── Category endpoints ───────────────────────────────────────────────────────
export const categoriesApi = {
  async list() {
    const { data } = await api.get('/api/categories');
    return data;
  },
  async create(payload: { name: string; type: string; icon?: string; color?: string }) {
    const { data } = await api.post('/api/categories', payload);
    return data;
  },
  async update(id: string, payload: Partial<{ name: string; icon: string; color: string }>) {
    const { data } = await api.put(`/api/categories/${id}`, payload);
    return data;
  },
  async remove(id: string) {
    const { data } = await api.delete(`/api/categories/${id}`);
    return data;
  },
};

// ─── Budget endpoints ─────────────────────────────────────────────────────────
export const budgetsApi = {
  async list(params?: { month?: number; year?: number }) {
    const { data } = await api.get('/api/budgets', { params });
    return data;
  },
  async upsert(payload: { categoryId: string; limit: number; period?: string; month?: number; year?: number }) {
    const { data } = await api.post('/api/budgets', payload);
    return data;
  },
  async remove(id: string) {
    const { data } = await api.delete(`/api/budgets/${id}`);
    return data;
  },
};

// ─── Analytics endpoints ──────────────────────────────────────────────────────
export const analyticsApi = {
  async monthly(year?: number) {
    const { data } = await api.get('/api/analytics/monthly', { params: { year } });
    return data;
  },
  async byCategory(month?: number, year?: number) {
    const { data } = await api.get('/api/analytics/category', { params: { month, year } });
    return data;
  },
};

// ─── Health check ─────────────────────────────────────────────────────────────
export const healthApi = {
  async check() {
    const { data } = await api.get('/health');
    return data;
  },
  async checkDB() {
    const { data } = await api.get('/health/db');
    return data;
  },
};

export default api;
