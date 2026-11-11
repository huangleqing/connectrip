export const PERMISSION_CODES = {
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

export const ALL_PERMISSION_CODES: string[] = Object.values(PERMISSION_CODES);

export const permissionTree = [
  {
    key: 'group:operation',
    title: '操作中心',
    type: 'group',
    children: [
      { key: PERMISSION_CODES.OPERATION_VIEW, title: '查看操作中心', type: 'menu' },
      { key: PERMISSION_CODES.OPERATION_EXPORT, title: '导出操作数据', type: 'button' },
    ],
  },
  {
    key: 'group:user',
    title: '用户管理',
    type: 'group',
    children: [
      { key: PERMISSION_CODES.USER_VIEW, title: '查看用户列表', type: 'menu' },
      { key: PERMISSION_CODES.USER_CREATE, title: '新增用户', type: 'button' },
      { key: PERMISSION_CODES.USER_UPDATE, title: '编辑用户', type: 'button' },
      { key: PERMISSION_CODES.USER_DELETE, title: '删除用户', type: 'button' },
      { key: PERMISSION_CODES.USER_RESET_PASSWORD, title: '重置密码', type: 'button' },
    ],
  },
  {
    key: 'group:role',
    title: '角色管理',
    type: 'group',
    children: [
      { key: PERMISSION_CODES.ROLE_VIEW, title: '查看角色列表', type: 'menu' },
      { key: PERMISSION_CODES.ROLE_CREATE, title: '新增角色', type: 'button' },
      { key: PERMISSION_CODES.ROLE_UPDATE, title: '编辑角色 / 分配权限', type: 'button' },
      { key: PERMISSION_CODES.ROLE_DELETE, title: '删除角色', type: 'button' },
    ],
  },
];
