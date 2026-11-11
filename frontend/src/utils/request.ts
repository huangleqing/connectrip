import { message } from 'antd';
import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { AUTH_NOTICE_KEY, clearToken, getToken } from './auth';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface BackendErrorBody {
  code?: number;
  message?: string | string[];
  error?: string;
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** 关闭全局错误提示，由调用方自行处理 */
    skipErrorToast?: boolean;
  }
}

const BASE_URL = '/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function resolveErrorMessage(error: AxiosError<BackendErrorBody>): string {
  const payload = error.response?.data;
  if (Array.isArray(payload?.message)) {
    return payload.message.join('；');
  }
  if (typeof payload?.message === 'string' && payload.message) {
    return payload.message;
  }
  if (payload?.error) {
    return payload.error;
  }
  if (error.code === 'ECONNABORTED') {
    return '请求超时，请稍后重试';
  }
  if (!error.response) {
    return '网络异常，请检查网络或后端服务';
  }
  return '请求失败，请稍后重试';
}

let lastUnauthorizedAt = 0;

function handleUnauthorized() {
  clearToken();
  const now = Date.now();
  const shouldToast = now - lastUnauthorizedAt > 1500;
  lastUnauthorizedAt = now;

  if (window.location.pathname.startsWith('/login')) {
    if (shouldToast) {
      message.error('登录状态已失效，请重新登录');
    }
    return;
  }

  // 使用整页跳转而非 SPA 路由，确保 initialState / 权限菜单被彻底清空，
  // 避免过期登录态下登录页与受保护页面互相重定向。
  sessionStorage.setItem(AUTH_NOTICE_KEY, '登录状态已失效，请重新登录');
  const redirect = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
  window.location.replace(`/login?redirect=${redirect}`);
}

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<BackendErrorBody>) => {
    const status = error.response?.status;
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    if (status === 401) {
      if (isLoginRequest) {
        if (!error.config?.skipErrorToast) {
          message.error(resolveErrorMessage(error));
        }
      } else {
        handleUnauthorized();
      }
    } else if (!error.config?.skipErrorToast) {
      message.error(resolveErrorMessage(error));
    }

    return Promise.reject(error);
  },
);

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await client.request<ApiResponse<T>>(config);
  const payload = response.data;

  // 后端统一响应体：{ code: 0, message: 'ok', data: T }
  if (payload && typeof payload === 'object' && 'code' in payload) {
    if (payload.code !== 0) {
      if (!config.skipErrorToast) {
        message.error(payload.message || '请求失败');
      }
      throw new Error(payload.message || '请求失败');
    }
    return payload.data;
  }

  // 兼容未包装的原始响应，方便后端逐步迁移
  return payload as unknown as T;
}

export const http = {
  get<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig) {
    return request<T>({ ...config, method: 'GET', url, params });
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return request<T>({ ...config, method: 'POST', url, data });
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return request<T>({ ...config, method: 'PUT', url, data });
  },
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return request<T>({ ...config, method: 'PATCH', url, data });
  },
  delete<T>(url: string, config?: AxiosRequestConfig) {
    return request<T>({ ...config, method: 'DELETE', url });
  },
};

export default http;
