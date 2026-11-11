import type { PageResult, PermissionNode, Role, RoleOption, RoleQuery, SaveRoleParams } from '@/types';
import { http } from '@/utils/request';

export function queryRoles(params: RoleQuery) {
  return http.get<PageResult<Role>>('/system/roles', { ...params });
}

export function getRoleOptions() {
  return http.get<RoleOption[]>('/system/roles/options');
}

export function getPermissionTree() {
  return http.get<PermissionNode[]>('/system/permissions');
}

export function createRole(data: SaveRoleParams) {
  return http.post<Role>('/system/roles', data);
}

export function updateRole(id: number, data: SaveRoleParams) {
  return http.put<Role>(`/system/roles/${id}`, data);
}

export function deleteRole(id: number) {
  return http.delete<{ success: boolean }>(`/system/roles/${id}`);
}
