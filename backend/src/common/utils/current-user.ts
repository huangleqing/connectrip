import { Prisma } from '@prisma/client';
import { SUPER_ADMIN_ROLE_CODE } from '../constants/roles';
import type { AuthUser } from '../types/auth-user';

export const userWithRolesInclude = Prisma.validator<Prisma.UserInclude>()({
  roles: {
    where: { role: { isDeleted: false } },
    include: {
      role: {
        include: {
          permissions: {
            where: { permission: { isDeleted: false } },
            include: {
              permission: true,
            },
          },
        },
      },
    },
  },
});

export type UserWithRoles = Prisma.UserGetPayload<{
  include: typeof userWithRolesInclude;
}>;

export function buildCurrentUser(user: UserWithRoles): AuthUser {
  const roles = user.roles.map((userRole) => userRole.role);

  const isSuperAdmin = roles.some((role) => role.code === SUPER_ADMIN_ROLE_CODE);
  const granted = new Set(
    roles.flatMap((role) =>
      role.permissions.map((rolePermission) => rolePermission.permission.code),
    ),
  );

  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatar,
    email: user.email,
    phone: user.phone,
    roles: roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
    })),
    permissions: Array.from(granted),
    isSuperAdmin,
  };
}
