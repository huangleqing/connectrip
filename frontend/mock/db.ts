import {
  ALL_PERMISSION_CODES,
  OPERATION_LINE_PERMISSION_CODES,
  PERMISSION_CODES,
} from './permissions';

export type MockUserStatus = 'active' | 'disabled';

export interface MockRole {
  id: number;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
}

export interface MockUser {
  id: number;
  username: string;
  nickname: string;
  password: string;
  email?: string;
  phone?: string;
  avatar?: string;
  roleIds: number[];
  status: MockUserStatus;
  lastLoginAt?: string | null;
  createdAt: string;
}

const SUPER_ADMIN_CODE = 'super_admin';

interface MockDatabaseState {
  roles: MockRole[];
  users: MockUser[];
}

/**
 * Umi Mock 会为不同 mock 文件分别加载依赖，模块级变量可能产生多份副本。
 * 把内存存储挂到 globalThis，确保 auth / roles / users 等接口共享同一份数据。
 */
const mockGlobal = globalThis as typeof globalThis & {
  __GD_TRAVEL_MOCK_DATABASE__?: MockDatabaseState;
};
const existingDatabase = mockGlobal.__GD_TRAVEL_MOCK_DATABASE__;

function daysAgo(days: number, hour = 9, minute = 30): string {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export const roles: MockRole[] = existingDatabase?.roles ?? [
  {
    id: 1,
    name: '超级管理员',
    code: SUPER_ADMIN_CODE,
    description: '系统内置最高权限角色，拥有全部菜单与按钮权限，不可编辑或删除。',
    permissions: [...ALL_PERMISSION_CODES],
    isSystem: true,
    createdAt: daysAgo(420),
  },
  {
    id: 2,
    name: '运营专员',
    code: 'operator',
    description: '负责日常运营操作，可访问操作中心全部线路并查看登录用户列表，金额默认隐藏。',
    permissions: [
      PERMISSION_CODES.OPERATION_VIEW,
      PERMISSION_CODES.OPERATION_EXPORT,
      PERMISSION_CODES.USER_VIEW,
      ...OPERATION_LINE_PERMISSION_CODES,
    ],
    isSystem: false,
    createdAt: daysAgo(300),
  },
  {
    id: 3,
    name: '只读访客',
    code: 'viewer',
    description: '仅可访问工作台，用于演示无业务菜单权限的登录账号。',
    permissions: [],
    isSystem: false,
    createdAt: daysAgo(210),
  },
  {
    id: 4,
    name: '计调专员',
    code: 'dispatcher',
    description: '负责旅行团计调工作，可查看操作中心全部线路及金额，不可导出 Excel。',
    permissions: [
      PERMISSION_CODES.OPERATION_VIEW,
      PERMISSION_CODES.OPERATION_AMOUNT_VIEW,
      ...OPERATION_LINE_PERMISSION_CODES,
    ],
    isSystem: false,
    createdAt: daysAgo(96),
  },
];

export const users: MockUser[] = existingDatabase?.users ?? [
  {
    id: 1,
    username: 'admin',
    nickname: '林悦',
    password: 'admin123',
    email: 'linyue@gdtravel.cn',
    phone: '13800000001',
    roleIds: [1],
    status: 'active',
    lastLoginAt: hoursAgo(0.2),
    createdAt: daysAgo(420, 10),
  },
  {
    id: 2,
    username: 'operator',
    nickname: '陈远',
    password: 'operator123',
    email: 'chenyuan@gdtravel.cn',
    phone: '13800000002',
    roleIds: [2],
    status: 'active',
    lastLoginAt: hoursAgo(2),
    createdAt: daysAgo(300, 11),
  },
  {
    id: 3,
    username: 'viewer',
    nickname: '苏晴',
    password: 'viewer123',
    email: 'suqing@gdtravel.cn',
    phone: '13800000003',
    roleIds: [3],
    status: 'active',
    lastLoginAt: hoursAgo(26),
    createdAt: daysAgo(210, 9),
  },
  {
    id: 4,
    username: 'zhouhang',
    nickname: '周航',
    password: '123456',
    email: 'zhouhang@gdtravel.cn',
    phone: '13800000004',
    roleIds: [4],
    status: 'active',
    lastLoginAt: hoursAgo(30),
    createdAt: daysAgo(186, 14),
  },
  {
    id: 5,
    username: 'liyan',
    nickname: '李妍',
    password: '123456',
    email: 'liyan@gdtravel.cn',
    phone: '13800000005',
    roleIds: [3],
    status: 'active',
    lastLoginAt: hoursAgo(49),
    createdAt: daysAgo(175, 10),
  },
  {
    id: 6,
    username: 'wangtao',
    nickname: '王涛',
    password: '123456',
    email: 'wangtao@gdtravel.cn',
    phone: '13800000006',
    roleIds: [2],
    status: 'disabled',
    lastLoginAt: hoursAgo(480),
    createdAt: daysAgo(160, 16),
  },
  {
    id: 7,
    username: 'zhaomin',
    nickname: '赵敏',
    password: '123456',
    email: 'zhaomin@gdtravel.cn',
    phone: '13800000007',
    roleIds: [4],
    status: 'active',
    lastLoginAt: hoursAgo(75),
    createdAt: daysAgo(142, 9),
  },
  {
    id: 8,
    username: 'sunyue',
    nickname: '孙悦',
    password: '123456',
    email: 'sunyue@gdtravel.cn',
    phone: '13800000008',
    roleIds: [2],
    status: 'active',
    lastLoginAt: hoursAgo(99),
    createdAt: daysAgo(120, 13),
  },
  {
    id: 9,
    username: 'heyu',
    nickname: '何雨',
    password: '123456',
    email: 'heyu@gdtravel.cn',
    phone: '13800000009',
    roleIds: [3],
    status: 'active',
    lastLoginAt: hoursAgo(125),
    createdAt: daysAgo(88, 11),
  },
  {
    id: 10,
    username: 'chenxi',
    nickname: '陈曦',
    password: '123456',
    email: 'chenxi@gdtravel.cn',
    phone: '13800000010',
    roleIds: [4],
    status: 'active',
    lastLoginAt: hoursAgo(155),
    createdAt: daysAgo(63, 15),
  },
  {
    id: 11,
    username: 'linan',
    nickname: '李楠',
    password: '123456',
    email: 'linan@gdtravel.cn',
    phone: '13800000011',
    roleIds: [3],
    status: 'disabled',
    lastLoginAt: null,
    createdAt: daysAgo(40, 10),
  },
  {
    id: 12,
    username: 'zhangqi',
    nickname: '张琪',
    password: '123456',
    email: 'zhangqi@gdtravel.cn',
    phone: '13800000012',
    roleIds: [2],
    status: 'active',
    lastLoginAt: hoursAgo(189),
    createdAt: daysAgo(18, 9),
  },
];

if (!existingDatabase) {
  mockGlobal.__GD_TRAVEL_MOCK_DATABASE__ = { roles, users };
}

export function findRoleById(id: number) {
  return roles.find((role) => role.id === id);
}

export function getSuperAdminRole() {
  return roles.find((role) => role.code === SUPER_ADMIN_CODE);
}

export function isSuperAdmin(user: MockUser): boolean {
  return user.roleIds.some((roleId) => findRoleById(roleId)?.code === SUPER_ADMIN_CODE);
}


export function roleBriefsFor(user: MockUser) {
  return user.roleIds
    .map((roleId) => findRoleById(roleId))
    .filter((role): role is MockRole => Boolean(role))
    .map((role) => ({ id: role.id, code: role.code, name: role.name }));
}

export function permissionsForUser(user: MockUser): string[] {
  if (isSuperAdmin(user)) {
    return [...ALL_PERMISSION_CODES];
  }

  const granted = new Set<string>();
  user.roleIds.forEach((roleId) => {
    findRoleById(roleId)?.permissions.forEach((permission) => granted.add(permission));
  });

  return ALL_PERMISSION_CODES.filter((permission) => granted.has(permission));
}

export function toPublicUser(user: MockUser) {
  const { password: _password, ...rest } = user;
  return {
    ...rest,
    roles: roleBriefsFor(user),
  };
}

export function toCurrentUser(user: MockUser) {
  const { password: _password, roleIds: _roleIds, lastLoginAt: _lastLoginAt, ...rest } = user;
  return {
    ...rest,
    roles: roleBriefsFor(user),
    permissions: permissionsForUser(user),
    isSuperAdmin: isSuperAdmin(user),
  };
}

export function toPublicRole(role: MockRole) {
  return {
    ...role,
    permissions: role.code === SUPER_ADMIN_CODE ? [...ALL_PERMISSION_CODES] : role.permissions,
    userCount: users.filter((user) => user.roleIds.includes(role.id)).length,
  };
}

export function createToken(userId: number): string {
  const payload = {
    sub: userId,
    iat: Date.now(),
    exp: Date.now() + 8 * 60 * 60 * 1000,
  };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function findUserByRequest(req: any): MockUser | null {
  const authorization = req?.headers?.authorization || '';
  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = authorization.slice(7).trim();
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as {
      sub?: number;
      exp?: number;
    };
    if (!payload?.sub || !payload?.exp || payload.exp < Date.now()) {
      return null;
    }
    return users.find((user) => user.id === Number(payload.sub)) ?? null;
  } catch {
    return null;
  }
}

export function nextId(list: Array<{ id: number }>): number {
  return list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}
