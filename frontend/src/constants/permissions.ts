/**
 * 权限标识与后端保持一致。
 * 命名约定：模块:资源:动作。
 */
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

/** 线路筛选标签 → 对应的数据权限。角色管理中勾选后，操作中控台才会展示对应线路。 */
export const OPERATION_LINE_PERMISSION_MAP: Record<string, string> = {
  票务: PERMISSIONS.OPERATION_LINE_TICKET,
  重庆: PERMISSIONS.OPERATION_LINE_CHONGQING,
  '老挝-LAO': PERMISSIONS.OPERATION_LINE_LAOS,
  '越南-VNM': PERMISSIONS.OPERATION_LINE_VIETNAM,
  '泰国-THA': PERMISSIONS.OPERATION_LINE_THAILAND,
  '法国-FRA': PERMISSIONS.OPERATION_LINE_FRANCE,
  '新加坡-SIN': PERMISSIONS.OPERATION_LINE_SINGAPORE,
  '阿联酋-UAE': PERMISSIONS.OPERATION_LINE_UAE,
  '马来西亚-MYS': PERMISSIONS.OPERATION_LINE_MALAYSIA,
  '蒙古国-MNG': PERMISSIONS.OPERATION_LINE_MONGOLIA,
  '个人业务-PB': PERMISSIONS.OPERATION_LINE_PERSONAL,
  中国台湾: PERMISSIONS.OPERATION_LINE_TAIWAN,
  'MYA-缅甸': PERMISSIONS.OPERATION_LINE_MYANMAR,
  '英国-UK': PERMISSIONS.OPERATION_LINE_UK,
  '文莱-BN': PERMISSIONS.OPERATION_LINE_BRUNEI,
  '加拿大-CA': PERMISSIONS.OPERATION_LINE_CANADA,
  '意大利-ITA': PERMISSIONS.OPERATION_LINE_ITALY,
};

export const OPERATION_LINE_PERMISSION_CODES = Object.values(
  OPERATION_LINE_PERMISSION_MAP,
);

export const PERMISSION_LABELS: Record<string, string> = {
  [PERMISSIONS.OPERATION_VIEW]: '查看操作中心',
  [PERMISSIONS.OPERATION_EXPORT]: '导出操作数据（Excel）',
  [PERMISSIONS.OPERATION_AMOUNT_VIEW]: '查看操作金额',
  [PERMISSIONS.OPERATION_LINE_TICKET]: '线路权限 · 票务',
  [PERMISSIONS.OPERATION_LINE_CHONGQING]: '线路权限 · 重庆',
  [PERMISSIONS.OPERATION_LINE_LAOS]: '线路权限 · 老挝-LAO',
  [PERMISSIONS.OPERATION_LINE_VIETNAM]: '线路权限 · 越南-VNM',
  [PERMISSIONS.OPERATION_LINE_THAILAND]: '线路权限 · 泰国-THA',
  [PERMISSIONS.OPERATION_LINE_FRANCE]: '线路权限 · 法国-FRA',
  [PERMISSIONS.OPERATION_LINE_SINGAPORE]: '线路权限 · 新加坡-SIN',
  [PERMISSIONS.OPERATION_LINE_UAE]: '线路权限 · 阿联酋-UAE',
  [PERMISSIONS.OPERATION_LINE_MALAYSIA]: '线路权限 · 马来西亚-MYS',
  [PERMISSIONS.OPERATION_LINE_MONGOLIA]: '线路权限 · 蒙古国-MNG',
  [PERMISSIONS.OPERATION_LINE_PERSONAL]: '线路权限 · 个人业务-PB',
  [PERMISSIONS.OPERATION_LINE_TAIWAN]: '线路权限 · 中国台湾',
  [PERMISSIONS.OPERATION_LINE_MYANMAR]: '线路权限 · MYA-缅甸',
  [PERMISSIONS.OPERATION_LINE_UK]: '线路权限 · 英国-UK',
  [PERMISSIONS.OPERATION_LINE_BRUNEI]: '线路权限 · 文莱-BN',
  [PERMISSIONS.OPERATION_LINE_CANADA]: '线路权限 · 加拿大-CA',
  [PERMISSIONS.OPERATION_LINE_ITALY]: '线路权限 · 意大利-ITA',
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
