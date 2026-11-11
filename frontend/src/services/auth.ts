import type { CurrentUser, LoginParams, LoginResult } from '@/types';
import { http } from '@/utils/request';

export function login(data: LoginParams) {
  return http.post<LoginResult>('/auth/login', data);
}

export function getCurrentUser() {
  return http.get<CurrentUser>('/auth/me');
}

export function logout() {
  return http.post<{ success: boolean }>('/auth/logout');
}
