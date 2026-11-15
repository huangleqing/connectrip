import 'dotenv/config';
import { PermissionType, PrismaClient } from '@prisma/client';
import {
  OPERATION_ACTION_CODES,
  OPERATION_LINE_PERMISSION_CODES,
  PERMISSIONS,
  PERMISSION_DEFINITIONS,
} from '../src/common/constants/permissions';

const prisma = new PrismaClient();

const NEW_PERMISSION_CODES = new Set<string>([
  PERMISSIONS.OPERATION_AMOUNT_VIEW,
  ...OPERATION_ACTION_CODES,
  ...OPERATION_LINE_PERMISSION_CODES,
]);

async function main() {
  const definitions = PERMISSION_DEFINITIONS.filter((definition) =>
    NEW_PERMISSION_CODES.has(definition.code),
  );

  for (const definition of definitions) {
    await prisma.permission.upsert({
      where: { code: definition.code },
      update: {
        name: definition.name,
        type: definition.type as PermissionType,
        module: definition.module,
        sort: definition.sort,
      },
      create: {
        code: definition.code,
        name: definition.name,
        type: definition.type as PermissionType,
        module: definition.module,
        sort: definition.sort,
      },
    });
  }

  const permissions = await prisma.permission.findMany({
    where: { code: { in: Array.from(NEW_PERMISSION_CODES) } },
  });
  const permissionByCode = new Map(
    permissions.map((permission) => [permission.code, permission]),
  );

  const roleGrants: Record<string, string[]> = {
    super_admin: Array.from(NEW_PERMISSION_CODES),
    operator: [
      ...OPERATION_ACTION_CODES,
      ...OPERATION_LINE_PERMISSION_CODES,
    ],
    dispatcher: [
      PERMISSIONS.OPERATION_AMOUNT_VIEW,
      ...OPERATION_LINE_PERMISSION_CODES,
    ],
  };

  for (const [roleCode, codes] of Object.entries(roleGrants)) {
    const role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) continue;

    const rows = codes
      .map((code) => permissionByCode.get(code))
      .filter((permission): permission is NonNullable<typeof permission> =>
        Boolean(permission),
      )
      .map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      }));

    await prisma.rolePermission.createMany({
      data: rows,
      skipDuplicates: true,
    });
  }

  // 兼容旧版权限：原先拥有 operation:create 的自定义角色，
  // 自动补齐拆分后的 6 个团队/线路操作权限，再移除旧权限。
  const legacyPermission = await prisma.permission.findUnique({
    where: { code: 'operation:create' },
    select: {
      id: true,
      roles: { select: { roleId: true } },
    },
  });

  if (legacyPermission) {
    const actionPermissions = permissions.filter((permission) =>
      OPERATION_ACTION_CODES.includes(
        permission.code as (typeof OPERATION_ACTION_CODES)[number],
      ),
    );
    const legacyRoleIds = legacyPermission.roles.map((item) => item.roleId);

    if (legacyRoleIds.length && actionPermissions.length) {
      await prisma.rolePermission.createMany({
        data: legacyRoleIds.flatMap((roleId) =>
          actionPermissions.map((permission) => ({
            roleId,
            permissionId: permission.id,
          })),
        ),
        skipDuplicates: true,
      });
    }

    await prisma.rolePermission.deleteMany({
      where: { permissionId: legacyPermission.id },
    });
    await prisma.permission.update({
      where: { id: legacyPermission.id },
      data: { isDeleted: true },
    });
  }

  await prisma.role.updateMany({
    where: { code: 'operator' },
    data: {
      description:
        '负责日常运营操作，可访问操作中心全部线路并管理团队/线路按钮，查看登录用户列表，金额默认隐藏。',
    },
  });
  await prisma.role.updateMany({
    where: { code: 'dispatcher' },
    data: {
      description:
        '负责旅行团计调工作，可查看操作中心全部线路及金额，不可导出 Excel。',
    },
  });

  const [permissionCount, rolePermissionCount] = await Promise.all([
    prisma.permission.count(),
    prisma.rolePermission.count(),
  ]);

  console.log(
    `已同步 ${definitions.length} 项操作中心权限；当前权限 ${permissionCount} 项，角色授权 ${rolePermissionCount} 条。`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
