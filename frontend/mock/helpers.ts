import {
  findUserByRequest,
  isSuperAdmin,
  permissionsForUser,
  type MockUser,
} from './db';

export function ok(res: any, data: unknown) {
  return res.status(200).json({
    code: 0,
    message: 'ok',
    data,
  });
}

export function fail(res: any, status: number, messageText: string) {
  return res.status(status).json({
    code: status,
    message: messageText,
    data: null,
  });
}

export function requireAuth(req: any, res: any): MockUser | null {
  const user = findUserByRequest(req);
  if (!user) {
    fail(res, 401, '登录状态已过期，请重新登录');
    return null;
  }
  if (user.status !== 'active') {
    fail(res, 403, '账号已被停用，请联系管理员');
    return null;
  }
  return user;
}

export function requirePermission(req: any, res: any, permission: string): MockUser | null {
  const user = requireAuth(req, res);
  if (!user) return null;

  if (isSuperAdmin(user) || permissionsForUser(user).includes(permission)) {
    return user;
  }

  fail(res, 403, '当前账号无权执行该操作');
  return null;
}

export function parsePagination(query: any) {
  const page = Math.max(1, Number.parseInt(String(query?.page ?? 1), 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(String(query?.pageSize ?? 10), 10) || 10),
  );
  return { page, pageSize };
}

export function keywordOf(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}
