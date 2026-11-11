/**
 * 权限标识与后端保持一致。
 * 命名约定：模块:资源:动作。
 */
export const PERMISSIONS = {
  OPERATION_VIEW: 'operation:view',
  OPERATION_EXPORT: 'operation:export',

  USER_VIEW: 'system:user:view',
  USER_CREATE: 'system:user:create',
  USER_UPDATE: 'system:user:update',
  USER_DELETE: 'system:user:delete',
  USER_RESET_PASSWORD: 'system:user:reset-password',

  ROLE_VIEW: 'system:role:view',
  ROLE_CREATE: 'system:role:create',
  ROLE_UPDATE: 'system:role:update',
  ROLE_DELETE: 'system:role:delete',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_LABELS: Record<string, string> = {
  [PERMISSIONS.OPERATION_VIEW]: '查看操作中心',
  [PERMISSIONS.OPERATION_EXPORT]: '导出操作数据',
  [PERMISSIONS.USER_VIEW]: '查看用户',
  [PERMISSIONS.USER_CREATE]: '新增用户',
  [PERMISSIONS.USER_UPDATE]: '编辑用户',
  [PERMISSIONS.USER_DELETE]: '删除用户',
  [PERMISSIONS.USER_RESET_PASSWORD]: '重置密码',
  [PERMISSIONS.ROLE_VIEW]: '查看角色',
  [PERMISSIONS.ROLE_CREATE]: '新增角色',
  [PERMISSIONS.ROLE_UPDATE]: '编辑角色',
  [PERMISSIONS.ROLE_DELETE]: '删除角色',
};

/** 系统内置角色 */
export const ROLE_CODES = {
  SUPER_ADMIN: 'super_admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
} as const;

export const ROLE_TAG_COLORS: Record<string, string> = {
  super_admin: 'gold',
  operator: 'blue',
  viewer: 'default',
};
