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

export type PermissionTypeValue = 'MENU' | 'BUTTON';

export interface PermissionDefinition {
  code: PermissionCode;
  name: string;
  type: PermissionTypeValue;
  module: string;
  moduleTitle: string;
  sort: number;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    code: PERMISSIONS.OPERATION_VIEW,
    name: '查看操作中心',
    type: 'MENU',
    module: 'operation',
    moduleTitle: '操作中心',
    sort: 1,
  },
  {
    code: PERMISSIONS.OPERATION_EXPORT,
    name: '导出操作数据',
    type: 'BUTTON',
    module: 'operation',
    moduleTitle: '操作中心',
    sort: 2,
  },
  {
    code: PERMISSIONS.USER_VIEW,
    name: '查看用户列表',
    type: 'MENU',
    module: 'user',
    moduleTitle: '用户管理',
    sort: 10,
  },
  {
    code: PERMISSIONS.USER_CREATE,
    name: '新增用户',
    type: 'BUTTON',
    module: 'user',
    moduleTitle: '用户管理',
    sort: 11,
  },
  {
    code: PERMISSIONS.USER_UPDATE,
    name: '编辑用户',
    type: 'BUTTON',
    module: 'user',
    moduleTitle: '用户管理',
    sort: 12,
  },
  {
    code: PERMISSIONS.USER_DELETE,
    name: '删除用户',
    type: 'BUTTON',
    module: 'user',
    moduleTitle: '用户管理',
    sort: 13,
  },
  {
    code: PERMISSIONS.USER_RESET_PASSWORD,
    name: '重置密码',
    type: 'BUTTON',
    module: 'user',
    moduleTitle: '用户管理',
    sort: 14,
  },
  {
    code: PERMISSIONS.ROLE_VIEW,
    name: '查看角色列表',
    type: 'MENU',
    module: 'role',
    moduleTitle: '角色管理',
    sort: 20,
  },
  {
    code: PERMISSIONS.ROLE_CREATE,
    name: '新增角色',
    type: 'BUTTON',
    module: 'role',
    moduleTitle: '角色管理',
    sort: 21,
  },
  {
    code: PERMISSIONS.ROLE_UPDATE,
    name: '编辑角色 / 分配权限',
    type: 'BUTTON',
    module: 'role',
    moduleTitle: '角色管理',
    sort: 22,
  },
  {
    code: PERMISSIONS.ROLE_DELETE,
    name: '删除角色',
    type: 'BUTTON',
    module: 'role',
    moduleTitle: '角色管理',
    sort: 23,
  },
];

export const ALL_PERMISSION_CODES: PermissionCode[] = PERMISSION_DEFINITIONS.map(
  (permission) => permission.code,
);

export const PERMISSION_CODE_SET = new Set<string>(ALL_PERMISSION_CODES);

export interface PermissionTreeNode {
  key: string;
  title: string;
  type: 'group' | 'menu' | 'button';
  children?: PermissionTreeNode[];
}

/**
 * 返回前端角色权限树。group 节点只用于分组，不保存到角色权限中。
 */
export function buildPermissionTree(): PermissionTreeNode[] {
  const modules = new Map<string, PermissionTreeNode>();

  for (const definition of PERMISSION_DEFINITIONS) {
    let group = modules.get(definition.module);
    if (!group) {
      group = {
        key: `group:${definition.module}`,
        title: definition.moduleTitle,
        type: 'group',
        children: [],
      };
      modules.set(definition.module, group);
    }

    group.children?.push({
      key: definition.code,
      title: definition.name,
      type: definition.type === 'MENU' ? 'menu' : 'button',
    });
  }

  return Array.from(modules.values());
}
