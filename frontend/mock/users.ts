import {
  findRoleById,
  getSuperAdminRole,
  isSuperAdmin,
  nextId,
  toPublicUser,
  users,
  type MockUser,
} from './db';
import { fail, keywordOf, ok, parsePagination, requirePermission } from './helpers';
import { PERMISSION_CODES } from './permissions';

const VALID_STATUS = new Set(['active', 'disabled']);

function normalizeRoleIds(raw: unknown): number[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const ids = Array.from(new Set(raw.map((item) => Number(item))));
  if (ids.some((id) => !Number.isInteger(id) || !findRoleById(id))) {
    return null;
  }
  return ids;
}

function sameIds(left: number[], right: number[]): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort((a, b) => a - b);
  const sortedRight = [...right].sort((a, b) => a - b);
  return sortedLeft.every((id, index) => id === sortedRight[index]);
}

function normalizeStatus(raw: unknown, fallback: MockUser['status'] = 'active'): MockUser['status'] {
  return typeof raw === 'string' && VALID_STATUS.has(raw) ? (raw as MockUser['status']) : fallback;
}

function trimmedOptional(raw: unknown): string | undefined {
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

export default {
  'GET /api/system/users': (req: any, res: any) => {
    const current = requirePermission(req, res, PERMISSION_CODES.USER_VIEW);
    if (!current) return;

    const { page, pageSize } = parsePagination(req.query);
    const keyword = keywordOf(req.query.keyword);
    const roleCode = keywordOf(req.query.roleCode);
    const status = keywordOf(req.query.status);

    const filtered = users.filter((user) => {
      if (status && user.status !== status) return false;

      if (roleCode) {
        const hasRole = user.roleIds.some((roleId) => findRoleById(roleId)?.code === roleCode);
        if (!hasRole) return false;
      }

      if (keyword) {
        const haystack = [user.username, user.nickname, user.email, user.phone]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }

      return true;
    });

    const start = (page - 1) * pageSize;

    return ok(res, {
      list: filtered.slice(start, start + pageSize).map(toPublicUser),
      total: filtered.length,
      page,
      pageSize,
    });
  },

  'POST /api/system/users': (req: any, res: any) => {
    const current = requirePermission(req, res, PERMISSION_CODES.USER_CREATE);
    if (!current) return;

    const body = req.body ?? {};
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const roleIds = normalizeRoleIds(body.roleIds);

    if (!/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(username)) {
      return fail(res, 400, '登录账号需为 3-20 位字母、数字或下划线，并以字母开头');
    }
    if (!nickname) {
      return fail(res, 400, '请输入用户昵称');
    }
    if (password.length < 6 || password.length > 32) {
      return fail(res, 400, '初始密码长度需为 6-32 位');
    }
    if (!roleIds) {
      return fail(res, 400, '请至少选择一个有效角色');
    }
    if (users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      return fail(res, 409, '登录账号已存在');
    }

    const superAdminRole = getSuperAdminRole();
    if (superAdminRole && roleIds.includes(superAdminRole.id) && !isSuperAdmin(current)) {
      return fail(res, 403, '只有超级管理员可以分配超级管理员角色');
    }

    const now = new Date().toISOString();
    const created: MockUser = {
      id: nextId(users),
      username,
      nickname,
      password,
      email: trimmedOptional(body.email),
      phone: trimmedOptional(body.phone),
      roleIds,
      status: normalizeStatus(body.status),
      lastLoginAt: null,
      createdAt: now,
    };

    users.push(created);
    return ok(res, toPublicUser(created));
  },

  'PUT /api/system/users/:id': (req: any, res: any) => {
    const current = requirePermission(req, res, PERMISSION_CODES.USER_UPDATE);
    if (!current) return;

    const target = users.find((user) => user.id === Number(req.params.id));
    if (!target) {
      return fail(res, 404, '用户不存在');
    }

    const body = req.body ?? {};
    const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : '';
    const roleIds = normalizeRoleIds(body.roleIds);
    const status = normalizeStatus(body.status, target.status);

    if (!nickname) {
      return fail(res, 400, '请输入用户昵称');
    }
    if (!roleIds) {
      return fail(res, 400, '请至少选择一个有效角色');
    }

    const superAdminRole = getSuperAdminRole();
    if (superAdminRole && roleIds.includes(superAdminRole.id) && !isSuperAdmin(current)) {
      return fail(res, 403, '只有超级管理员可以分配超级管理员角色');
    }
    if (target.id === current.id && (!sameIds(target.roleIds, roleIds) || status !== target.status)) {
      return fail(res, 400, '不能修改当前登录账号的角色或启用状态');
    }
    if (isSuperAdmin(target) && superAdminRole && !roleIds.includes(superAdminRole.id)) {
      return fail(res, 400, '不能移除超级管理员的核心角色');
    }
    if (isSuperAdmin(target) && status === 'disabled') {
      return fail(res, 400, '超级管理员账号不能被停用');
    }

    target.nickname = nickname;
    target.email = trimmedOptional(body.email);
    target.phone = trimmedOptional(body.phone);
    target.roleIds = roleIds;
    target.status = status;

    return ok(res, toPublicUser(target));
  },

  'PATCH /api/system/users/:id/status': (req: any, res: any) => {
    const current = requirePermission(req, res, PERMISSION_CODES.USER_UPDATE);
    if (!current) return;

    const target = users.find((user) => user.id === Number(req.params.id));
    if (!target) {
      return fail(res, 404, '用户不存在');
    }

    if (!VALID_STATUS.has(req.body?.status)) {
      return fail(res, 400, '无效的账号状态');
    }
    const status = req.body.status as MockUser['status'];
    if (status === target.status) {
      return ok(res, toPublicUser(target));
    }
    if (target.id === current.id) {
      return fail(res, 400, '不能停用当前登录账号');
    }
    if (isSuperAdmin(target) && status === 'disabled') {
      return fail(res, 400, '超级管理员账号不能被停用');
    }

    target.status = status;
    return ok(res, toPublicUser(target));
  },

  'POST /api/system/users/:id/reset-password': (req: any, res: any) => {
    const current = requirePermission(req, res, PERMISSION_CODES.USER_RESET_PASSWORD);
    if (!current) return;

    const target = users.find((user) => user.id === Number(req.params.id));
    if (!target) {
      return fail(res, 404, '用户不存在');
    }

    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (password.length < 6 || password.length > 32) {
      return fail(res, 400, '新密码长度需为 6-32 位');
    }

    target.password = password;
    return ok(res, { success: true });
  },

  'DELETE /api/system/users/:id': (req: any, res: any) => {
    const current = requirePermission(req, res, PERMISSION_CODES.USER_DELETE);
    if (!current) return;

    const index = users.findIndex((user) => user.id === Number(req.params.id));
    if (index === -1) {
      return fail(res, 404, '用户不存在');
    }

    const target = users[index];
    if (target.id === current.id) {
      return fail(res, 400, '不能删除当前登录账号');
    }
    if (isSuperAdmin(target)) {
      return fail(res, 400, '超级管理员账号不能被删除');
    }

    users.splice(index, 1);
    return ok(res, { success: true });
  },
};
