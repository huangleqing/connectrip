import { isSuperAdmin, permissionsForUser, roles, toPublicUser, users } from './db';
import { ok, requireAuth } from './helpers';
import { ALL_PERMISSION_CODES, PERMISSION_CODES } from './permissions';

export default {
  'GET /api/dashboard/summary': (req: any, res: any) => {
    const current = requireAuth(req, res);
    if (!current) return;

    const canViewUsers =
      isSuperAdmin(current) || permissionsForUser(current).includes(PERMISSION_CODES.USER_VIEW);

    const recentUsers = canViewUsers
      ? [...users]
          .filter((user) => Boolean(user.lastLoginAt))
          .sort((left, right) => {
            return (
              new Date(right.lastLoginAt ?? 0).getTime() -
              new Date(left.lastLoginAt ?? 0).getTime()
            );
          })
          .slice(0, 6)
          .map(toPublicUser)
      : [];

    return ok(res, {
      userCount: users.length,
      activeUserCount: users.filter((user) => user.status === 'active').length,
      roleCount: roles.length,
      permissionCount: ALL_PERMISSION_CODES.length,
      todayOperations: 168,
      systemStatus: 'operational',
      recentUsers,
    });
  },
};
