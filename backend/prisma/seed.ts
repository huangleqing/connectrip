import { PrismaClient, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  ALL_PERMISSION_CODES,
  OPERATION_LINE_PERMISSION_CODES,
  PERMISSION_DEFINITIONS,
  PERMISSIONS,
} from '../src/common/constants/permissions';
import { SUPER_ADMIN_ROLE_CODE } from '../src/common/constants/roles';

const prisma = new PrismaClient();

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysAgo(days: number, hour = 9, minute = 30): Date {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  date.setHours(hour, minute, 0, 0);
  return date;
}

interface SeedUser {
  username: string;
  nickname: string;
  password: string;
  email: string;
  phone: string;
  roleCodes: string[];
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
}

const seedUsers: SeedUser[] = [
  {
    username: 'admin',
    nickname: '林悦',
    password: 'admin123',
    email: 'linyue@gdtravel.cn',
    phone: '13800000001',
    roleCodes: [SUPER_ADMIN_ROLE_CODE],
    status: UserStatus.ACTIVE,
    lastLoginAt: hoursAgo(0.2),
    createdAt: daysAgo(420, 10),
  },
  {
    username: 'operator',
    nickname: '陈远',
    password: 'operator123',
    email: 'chenyuan@gdtravel.cn',
    phone: '13800000002',
    roleCodes: ['operator'],
    status: UserStatus.ACTIVE,
    lastLoginAt: hoursAgo(2),
    createdAt: daysAgo(300, 11),
  },
  {
    username: 'viewer',
    nickname: '苏晴',
    password: 'viewer123',
    email: 'suqing@gdtravel.cn',
    phone: '13800000003',
    roleCodes: ['viewer'],
    status: UserStatus.ACTIVE,
    lastLoginAt: hoursAgo(26),
    createdAt: daysAgo(210, 9),
  },
  {
    username: 'zhouhang',
    nickname: '周航',
    password: '123456',
    email: 'zhouhang@gdtravel.cn',
    phone: '13800000004',
    roleCodes: ['dispatcher'],
    status: UserStatus.ACTIVE,
    lastLoginAt: hoursAgo(30),
    createdAt: daysAgo(186, 14),
  },
  {
    username: 'liyan',
    nickname: '李妍',
    password: '123456',
    email: 'liyan@gdtravel.cn',
    phone: '13800000005',
    roleCodes: ['viewer'],
    status: UserStatus.ACTIVE,
    lastLoginAt: hoursAgo(49),
    createdAt: daysAgo(175, 10),
  },
  {
    username: 'wangtao',
    nickname: '王涛',
    password: '123456',
    email: 'wangtao@gdtravel.cn',
    phone: '13800000006',
    roleCodes: ['operator'],
    status: UserStatus.DISABLED,
    lastLoginAt: hoursAgo(480),
    createdAt: daysAgo(160, 16),
  },
  {
    username: 'zhaomin',
    nickname: '赵敏',
    password: '123456',
    email: 'zhaomin@gdtravel.cn',
    phone: '13800000007',
    roleCodes: ['dispatcher'],
    status: UserStatus.ACTIVE,
    lastLoginAt: hoursAgo(75),
    createdAt: daysAgo(142, 9),
  },
  {
    username: 'sunyue',
    nickname: '孙悦',
    password: '123456',
    email: 'sunyue@gdtravel.cn',
    phone: '13800000008',
    roleCodes: ['operator'],
    status: UserStatus.ACTIVE,
    lastLoginAt: hoursAgo(99),
    createdAt: daysAgo(120, 13),
  },
  {
    username: 'heyu',
    nickname: '何雨',
    password: '123456',
    email: 'heyu@gdtravel.cn',
    phone: '13800000009',
    roleCodes: ['viewer'],
    status: UserStatus.ACTIVE,
    lastLoginAt: hoursAgo(125),
    createdAt: daysAgo(88, 11),
  },
  {
    username: 'chenxi',
    nickname: '陈曦',
    password: '123456',
    email: 'chenxi@gdtravel.cn',
    phone: '13800000010',
    roleCodes: ['dispatcher'],
    status: UserStatus.ACTIVE,
    lastLoginAt: hoursAgo(155),
    createdAt: daysAgo(63, 15),
  },
  {
    username: 'linan',
    nickname: '李楠',
    password: '123456',
    email: 'linan@gdtravel.cn',
    phone: '13800000011',
    roleCodes: ['viewer'],
    status: UserStatus.DISABLED,
    lastLoginAt: null,
    createdAt: daysAgo(40, 10),
  },
  {
    username: 'zhangqi',
    nickname: '张琪',
    password: '123456',
    email: 'zhangqi@gdtravel.cn',
    phone: '13800000012',
    roleCodes: ['operator'],
    status: UserStatus.ACTIVE,
    lastLoginAt: hoursAgo(189),
    createdAt: daysAgo(18, 9),
  },
];

const seedRoles = [
  {
    code: SUPER_ADMIN_ROLE_CODE,
    name: '超级管理员',
    description: '系统内置最高权限角色，拥有全部菜单与按钮权限，不可编辑或删除。',
    isSystem: true,
    permissions: [...ALL_PERMISSION_CODES],
  },
  {
    code: 'operator',
    name: '运营专员',
    description: '负责日常运营操作，可访问操作中心全部线路并查看登录用户列表，金额默认隐藏。',
    isSystem: false,
    permissions: [
      PERMISSIONS.OPERATION_VIEW,
      PERMISSIONS.OPERATION_EXPORT,
      PERMISSIONS.USER_VIEW,
      ...OPERATION_LINE_PERMISSION_CODES,
    ],
  },
  {
    code: 'viewer',
    name: '只读访客',
    description: '仅可访问工作台，用于演示无业务菜单权限的登录账号。',
    isSystem: false,
    permissions: [],
  },
  {
    code: 'dispatcher',
    name: '计调专员',
    description: '负责旅行团计调工作，可查看操作中心全部线路及金额，不可导出 Excel。',
    isSystem: false,
    permissions: [
      PERMISSIONS.OPERATION_VIEW,
      PERMISSIONS.OPERATION_AMOUNT_VIEW,
      ...OPERATION_LINE_PERMISSION_CODES,
    ],
  },
];

async function main() {
  // 1. 权限
  for (const permission of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        name: permission.name,
        type: permission.type,
        module: permission.module,
        sort: permission.sort,
      },
      create: {
        code: permission.code,
        name: permission.name,
        type: permission.type,
        module: permission.module,
        sort: permission.sort,
      },
    });
  }

  // 2. 角色
  for (const role of seedRoles) {
    const saved = await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
      create: {
        code: role.code,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
    });

    await prisma.role.update({
      where: { id: saved.id },
      data: {
        permissions: {
          deleteMany: {},
          create: role.permissions.map((code) => ({
            permission: { connect: { code } },
          })),
        },
      },
    });
  }

  // 3. 用户与角色绑定
  const roleRecords = await prisma.role.findMany({
    select: { id: true, code: true },
  });
  const roleCodeToId = new Map(roleRecords.map((role) => [role.code, role.id]));
  const passwordHashCache = new Map<string, string>();

  for (const user of seedUsers) {
    let passwordHash = passwordHashCache.get(user.password);
    if (!passwordHash) {
      passwordHash = await bcrypt.hash(user.password, 10);
      passwordHashCache.set(user.password, passwordHash);
    }

    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        passwordHash,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        roles: {
          deleteMany: {},
          create: user.roleCodes.map((code) => ({
            role: {
              connect: { id: roleCodeToId.get(code) as number },
            },
          })),
        },
      },
      create: {
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        passwordHash,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        roles: {
          create: user.roleCodes.map((code) => ({
            role: {
              connect: { id: roleCodeToId.get(code) as number },
            },
          })),
        },
      },
    });
  }

  console.log(
    `种子数据完成：${PERMISSION_DEFINITIONS.length} 个权限、${seedRoles.length} 个角色、${seedUsers.length} 个用户`,
  );
  console.log('演示账号：admin/admin123、operator/operator123、viewer/viewer123');
}

main()
  .catch((error) => {
    console.error('种子数据执行失败:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
