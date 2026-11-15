export const PERMISSIONS = {
  OPERATION_VIEW: 'operation:view',
  OPERATION_EXPORT: 'operation:export',
  OPERATION_AMOUNT_VIEW: 'operation:amount:view',

  OPERATION_TOUR_CREATE: 'operation:tour:create',
  OPERATION_TOUR_UPDATE: 'operation:tour:update',
  OPERATION_TOUR_DELETE: 'operation:tour:delete',
  OPERATION_LINE_CONFIG_CREATE: 'operation:line:config:create',
  OPERATION_LINE_CONFIG_UPDATE: 'operation:line:config:update',
  OPERATION_LINE_CONFIG_DELETE: 'operation:line:config:delete',

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

export interface BuiltinOperationLine {
  name: string;
  code: string;
  permissionCode: PermissionCode;
  sort: number;
}

export const BUILTIN_OPERATION_LINES: BuiltinOperationLine[] = [
  { name: '票务', code: 'ticket', permissionCode: PERMISSIONS.OPERATION_LINE_TICKET, sort: 10 },
  { name: '重庆', code: 'chongqing', permissionCode: PERMISSIONS.OPERATION_LINE_CHONGQING, sort: 20 },
  { name: '老挝-LAO', code: 'laos', permissionCode: PERMISSIONS.OPERATION_LINE_LAOS, sort: 30 },
  { name: '越南-VNM', code: 'vietnam', permissionCode: PERMISSIONS.OPERATION_LINE_VIETNAM, sort: 40 },
  { name: '泰国-THA', code: 'thailand', permissionCode: PERMISSIONS.OPERATION_LINE_THAILAND, sort: 50 },
  { name: '法国-FRA', code: 'france', permissionCode: PERMISSIONS.OPERATION_LINE_FRANCE, sort: 60 },
  { name: '新加坡-SIN', code: 'singapore', permissionCode: PERMISSIONS.OPERATION_LINE_SINGAPORE, sort: 70 },
  { name: '阿联酋-UAE', code: 'uae', permissionCode: PERMISSIONS.OPERATION_LINE_UAE, sort: 80 },
  { name: '马来西亚-MYS', code: 'malaysia', permissionCode: PERMISSIONS.OPERATION_LINE_MALAYSIA, sort: 90 },
  { name: '蒙古国-MNG', code: 'mongolia', permissionCode: PERMISSIONS.OPERATION_LINE_MONGOLIA, sort: 100 },
  { name: '个人业务-PB', code: 'personal', permissionCode: PERMISSIONS.OPERATION_LINE_PERSONAL, sort: 110 },
  { name: '中国台湾', code: 'taiwan', permissionCode: PERMISSIONS.OPERATION_LINE_TAIWAN, sort: 120 },
  { name: 'MYA-缅甸', code: 'myanmar', permissionCode: PERMISSIONS.OPERATION_LINE_MYANMAR, sort: 130 },
  { name: '英国-UK', code: 'uk', permissionCode: PERMISSIONS.OPERATION_LINE_UK, sort: 140 },
  { name: '文莱-BN', code: 'brunei', permissionCode: PERMISSIONS.OPERATION_LINE_BRUNEI, sort: 150 },
  { name: '加拿大-CA', code: 'canada', permissionCode: PERMISSIONS.OPERATION_LINE_CANADA, sort: 160 },
  { name: '意大利-ITA', code: 'italy', permissionCode: PERMISSIONS.OPERATION_LINE_ITALY, sort: 170 },
];

export const OPERATION_LINE_PERMISSION_CODES: PermissionCode[] =
  BUILTIN_OPERATION_LINES.map((item) => item.permissionCode);

export const OPERATION_TOUR_ACTION_CODES: PermissionCode[] = [
  PERMISSIONS.OPERATION_TOUR_CREATE,
  PERMISSIONS.OPERATION_TOUR_UPDATE,
  PERMISSIONS.OPERATION_TOUR_DELETE,
];

export const OPERATION_LINE_CONFIG_CODES: PermissionCode[] = [
  PERMISSIONS.OPERATION_LINE_CONFIG_CREATE,
  PERMISSIONS.OPERATION_LINE_CONFIG_UPDATE,
  PERMISSIONS.OPERATION_LINE_CONFIG_DELETE,
];

export const OPERATION_ACTION_CODES: PermissionCode[] = [
  ...OPERATION_TOUR_ACTION_CODES,
  ...OPERATION_LINE_CONFIG_CODES,
];

const OPERATION_LINE_DEFINITIONS: PermissionDefinition[] =
  BUILTIN_OPERATION_LINES.map((item) => ({
    code: item.permissionCode,
    name: item.name,
    type: 'BUTTON',
    module: 'operation',
    moduleTitle: '操作中心',
    subgroup: 'operation-line',
    subgroupTitle: '线路 / 国家权限',
    sort: 100 + item.sort,
  }));

/**
 * 所有页面按钮权限都从这里生成，并同步进入角色管理的权限树。
 * 新增页面按钮时：在这里增加 BUTTON 定义、在 operation.controller.ts
 * 使用 @RequirePermissions()，前端使用 <Access> 或 useAccess() 控制显示。
 */
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
  {
    code: PERMISSIONS.OPERATION_TOUR_CREATE,
    name: '新增团队',
    type: 'BUTTON',
    module: 'operation',
    moduleTitle: '操作中心',
    subgroup: 'operation-team-actions',
    subgroupTitle: '团队操作',
    sort: 4,
  },
  {
    code: PERMISSIONS.OPERATION_TOUR_UPDATE,
    name: '编辑团队',
    type: 'BUTTON',
    module: 'operation',
    moduleTitle: '操作中心',
    subgroup: 'operation-team-actions',
    subgroupTitle: '团队操作',
    sort: 5,
  },
  {
    code: PERMISSIONS.OPERATION_TOUR_DELETE,
    name: '删除团队',
    type: 'BUTTON',
    module: 'operation',
    moduleTitle: '操作中心',
    subgroup: 'operation-team-actions',
    subgroupTitle: '团队操作',
    sort: 6,
  },
  {
    code: PERMISSIONS.OPERATION_LINE_CONFIG_CREATE,
    name: '新增线路',
    type: 'BUTTON',
    module: 'operation',
    moduleTitle: '操作中心',
    subgroup: 'operation-line-actions',
    subgroupTitle: '线路管理操作',
    sort: 7,
  },
  {
    code: PERMISSIONS.OPERATION_LINE_CONFIG_UPDATE,
    name: '编辑线路',
    type: 'BUTTON',
    module: 'operation',
    moduleTitle: '操作中心',
    subgroup: 'operation-line-actions',
    subgroupTitle: '线路管理操作',
    sort: 8,
  },
  {
    code: PERMISSIONS.OPERATION_LINE_CONFIG_DELETE,
    name: '删除线路',
    type: 'BUTTON',
    module: 'operation',
    moduleTitle: '操作中心',
    subgroup: 'operation-line-actions',
    subgroupTitle: '线路管理操作',
    sort: 9,
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

export interface PermissionLineItem {
  code: string;
  title: string;
}

const DEFAULT_PERMISSION_LINES: PermissionLineItem[] = BUILTIN_OPERATION_LINES.map(
  (line) => ({ code: line.permissionCode, title: line.name }),
);

/**
 * 返回前端角色权限树。group 节点只用于分组，不保存到角色权限中。
 * 线路权限来自 operation_lines 表，以支持手动新增线路。
 */
export function buildPermissionTree(
  operationLines: PermissionLineItem[] = DEFAULT_PERMISSION_LINES,
): PermissionTreeNode[] {
  const modules = new Map<string, PermissionTreeNode>();

  for (const definition of PERMISSION_DEFINITIONS) {
    // 线路权限统一由 operation_lines 提供，避免内置线路与数据库线路重复。
    if (definition.subgroup === 'operation-line') {
      continue;
    }

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

    const leaf: PermissionTreeNode = {
      key: definition.code,
      title: definition.name,
      type: definition.type === 'MENU' ? 'menu' : 'button',
    };

    if (definition.subgroup) {
      const subgroupKey = `group:${definition.subgroup}`;
      let subgroup = group.children?.find((node) => node.key === subgroupKey);
      if (!subgroup) {
        subgroup = {
          key: subgroupKey,
          title: definition.subgroupTitle ?? definition.subgroup,
          type: 'group',
          children: [],
        };
        group.children?.push(subgroup);
      }
      subgroup.children?.push(leaf);
      continue;
    }

    group.children?.push(leaf);
  }

  const operationGroup = modules.get('operation');
  if (operationGroup && operationLines.length) {
    operationGroup.children?.push({
      key: 'group:operation-line',
      title: '线路 / 国家权限',
      type: 'group',
      children: operationLines.map((line) => ({
        key: line.code,
        title: line.title,
        type: 'button' as const,
      })),
    });
  }

  return Array.from(modules.values());
}
