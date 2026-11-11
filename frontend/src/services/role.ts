import type {
  PageResult,
  PermissionNode,
  Role,
  RoleOption,
  RoleQuery,
  RoleUserOption,
  SaveRoleParams,
  UpdateRoleMembersParams,
  UpdateRoleMembersResult,
} from '@/types';
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

export function getRoleMemberUserOptions(
  roleId: number,
  params?: { keyword?: string; limit?: number },
) {
  return http.get<RoleUserOption[]>(`/system/roles/${roleId}/user-options`, params);
}

export function updateRoleMembers(roleId: number, data: UpdateRoleMembersParams) {
  return http.post<UpdateRoleMembersResult>(`/system/roles/${roleId}/members`, data);
}
