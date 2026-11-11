import type {
  CreateUserParams,
  PageResult,
  UpdateUserParams,
  User,
  UserQuery,
  UserStatus,
} from '@/types';
import { http } from '@/utils/request';

export function queryUsers(params: UserQuery) {
  return http.get<PageResult<User>>('/system/users', { ...params });
}

export function createUser(data: CreateUserParams) {
  return http.post<User>('/system/users', data);
}

export function updateUser(id: number, data: UpdateUserParams) {
  return http.put<User>(`/system/users/${id}`, data);
}

export function updateUserStatus(id: number, status: UserStatus) {
  return http.patch<User>(`/system/users/${id}/status`, { status });
}

export function resetUserPassword(id: number, password: string) {
  return http.post<{ success: boolean }>(`/system/users/${id}/reset-password`, { password });
}

export function deleteUser(id: number) {
  return http.delete<{ success: boolean }>(`/system/users/${id}`);
}
