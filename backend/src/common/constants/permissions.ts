export const PERMISSIONS = {
  OPERATION_VIEW: 'operation:view',
  OPERATION_EXPORT: 'operation:export',
  OPERATION_AMOUNT_VIEW: 'operation:amount:view',

  OPERATION_LINE_TICKET: 'operation:line:ticket',
  OPERATION_LINE_CHONGQING: 'operation:line:chongqing',
  OPERATION_LINE_LAOS: 'operation:line:laos',
  OPERATION_LINE_VIETNAM: 'operation:line:vietnam',
  OPERATION_LINE_THAILAND: 'operation:line:thailand',
  OPERATION_LINE_FRANCE: 'operation:line:france',
  OPERATION_LINE_SINGAPORE: 'operation:line:singapore',
  OPERATION_LINE_UAE: 'operation:line:uae',
  OPERATION_LINE_MALAYSIA: 'operation:line:malaysia',
  OPERATION_LINE_MONGOLIA: 'operation:line:mongolia',
  OPERATION_LINE_PERSONAL: 'operation:line:personal',
  OPERATION_LINE_TAIWAN: 'operation:line:taiwan',
  OPERATION_LINE_MYANMAR: 'operation:line:myanmar',
  OPERATION_LINE_UK: 'operation:line:uk',
  OPERATION_LINE_BRUNEI: 'operation:line:brunei',
  OPERATION_LINE_CANADA: 'operation:line:canada',
  OPERATION_LINE_ITALY: 'operation:line:italy',

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
  /** 可选的二级分组标识，用于把一组权限嵌套在所属模块下 */
  subgroup?: string;
  subgroupTitle?: string;
  sort: number;
}

const OPERATION_LINE_LABELS: Array<{ name: string; code: PermissionCode }> = [
  { name: '票务', code: PERMISSIONS.OPERATION_LINE_TICKET },
  { name: '重庆', code: PERMISSIONS.OPERATION_LINE_CHONGQING },
  { name: '老挝-LAO', code: PERMISSIONS.OPERATION_LINE_LAOS },
  { name: '越南-VNM', code: PERMISSIONS.OPERATION_LINE_VIETNAM },
  { name: '泰国-THA', code: PERMISSIONS.OPERATION_LINE_THAILAND },
  { name: '法国-FRA', code: PERMISSIONS.OPERATION_LINE_FRANCE },
  { name: '新加坡-SIN', code: PERMISSIONS.OPERATION_LINE_SINGAPORE },
  { name: '阿联酋-UAE', code: PERMISSIONS.OPERATION_LINE_UAE },
  { name: '马来西亚-MYS', code: PERMISSIONS.OPERATION_LINE_MALAYSIA },
  { name: '蒙古国-MNG', code: PERMISSIONS.OPERATION_LINE_MONGOLIA },
  { name: '个人业务-PB', code: PERMISSIONS.OPERATION_LINE_PERSONAL },
  { name: '中国台湾', code: PERMISSIONS.OPERATION_LINE_TAIWAN },
  { name: 'MYA-缅甸', code: PERMISSIONS.OPERATION_LINE_MYANMAR },
  { name: '英国-UK', code: PERMISSIONS.OPERATION_LINE_UK },
  { name: '文莱-BN', code: PERMISSIONS.OPERATION_LINE_BRUNEI },
  { name: '加拿大-CA', code: PERMISSIONS.OPERATION_LINE_CANADA },
  { name: '意大利-ITA', code: PERMISSIONS.OPERATION_LINE_ITALY },
];

export const OPERATION_LINE_PERMISSION_CODES: PermissionCode[] =
  OPERATION_LINE_LABELS.map((item) => item.code);

const OPERATION_LINE_DEFINITIONS: PermissionDefinition[] =
  OPERATION_LINE_LABELS.map((item, index) => ({
    code: item.code,
    name: item.name,
    type: 'BUTTON',
    module: 'operation',
    moduleTitle: '操作中心',
    subgroup: 'operation-line',
    subgroupTitle: '线路 / 国家权限',
    sort: 100 + index,
  }));

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
    name: '导出操作数据（Excel）',
    type: 'BUTTON',
    module: 'operation',
    moduleTitle: '操作中心',
    sort: 2,
  },
  {
    code: PERMISSIONS.OPERATION_AMOUNT_VIEW,
    name: '查看操作金额',
    type: 'BUTTON',
    module: 'operation',
    moduleTitle: '操作中心',
    sort: 3,
  },
  ...OPERATION_LINE_DEFINITIONS,
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

    let target = group;
    if (definition.subgroup) {
      const subgroupKey = `group:${definition.subgroup}`;
      let subgroup = group.children?.find(
        (child) => child.type === 'group' && child.key === subgroupKey,
      );
      if (!subgroup) {
        subgroup = {
          key: subgroupKey,
          title: definition.subgroupTitle ?? definition.subgroup,
          type: 'group',
          children: [],
        };
        group.children?.push(subgroup);
      }
      target = subgroup;
    }

    target.children?.push({
      key: definition.code,
      title: definition.name,
      type: definition.type === 'MENU' ? 'menu' : 'button',
    });
  }

  return Array.from(modules.values());
}
