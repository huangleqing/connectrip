import { Injectable } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PERMISSIONS } from '../common/constants/permissions';
import { toApiUserStatus } from '../common/constants/user-status';
import type { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';

const recentUserInclude = Prisma.validator<Prisma.UserInclude>()({
  roles: {
    include: {
      role: true,
    },
  },
});

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(currentUser: AuthUser) {
    const canViewUsers =
      currentUser.isSuperAdmin || currentUser.permissions.includes(PERMISSIONS.USER_VIEW);

    const [userCount, activeUserCount, roleCount, permissionCount, recentUsers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
        this.prisma.role.count(),
        this.prisma.permission.count(),
        canViewUsers
          ? this.prisma.user.findMany({
              where: { lastLoginAt: { not: null } },
              include: recentUserInclude,
              orderBy: { lastLoginAt: 'desc' },
              take: 6,
            })
          : Promise.resolve([]),
      ]);

    return {
      userCount,
      activeUserCount,
      roleCount,
      permissionCount,
      // 操作中心业务接入后，此处改为读取操作日志统计
      todayOperations: 0,
      systemStatus: 'operational',
      recentUsers: recentUsers.map((user) => ({
        id: user.id,
        nickname: user.nickname,
        username: user.username,
        roles: user.roles.map((userRole) => ({
          id: userRole.role.id,
          code: userRole.role.code,
          name: userRole.role.name,
        })),
        status: toApiUserStatus(user.status),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      })),
    };
  }
}
