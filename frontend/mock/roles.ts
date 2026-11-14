import { isSuperAdmin, nextId, roles, toPublicRole, users } from './db';
import { fail, keywordOf, ok, parsePagination, requireAuth, requirePermission } from './helpers';
import { ALL_PERMISSION_CODES, PERMISSION_CODES, permissionTree } from './permissions';

const ROLE_CODE_PATTERN = /^[a-z][a-z0-9_]{2,31}$/;

function normalizePermissions(raw: unknown): string[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const requested = new Set(raw.map((item) => String(item)));
  if (Array.from(requested).some((code) => !ALL_PERMISSION_CODES.includes(code))) {
    return null;
  }
  return ALL_PERMISSION_CODES.filter((code) => requested.has(code));
}

function optionalText(raw: unknown, max: number): string | undefined | null {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (typeof raw !== 'string') return null;
  const text = raw.trim();
  if (text.length > max) return null;
  return text || undefined;
}

export default {
  'GET /api/system/roles': (req: any, res: any) => {
    const current = requirePermission(req, res, PERMISSION_CODES.ROLE_VIEW);
    if (!current) return;

    const { page, pageSize } = parsePagination(req.query);
    const keyword = keywordOf(req.query.keyword);

    const filtered = roles.filter((role) => {
      if (!keyword) return true;
      return [role.name, role.code, role.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });

    const start = (page - 1) * pageSize;

    return ok(res, {
      list: filtered.slice(start, start + pageSize).map(toPublicRole),
      total: filtered.length,
      page,
      pageSize,
    });
  },

  'GET /api/system/roles/options': (req: any, res: any) => {
    const current = requireAuth(req, res);
    if (!current) return;

    return ok(
      res,
      roles.map((role) => ({
        label: role.name,
        value: role.id,
        code: role.code,
      })),
    );
  },

  'GET /api/system/permissions': (req: any, res: any) => {
    const current = requirePermission(req, res, PERMISSION_CODES.ROLE_VIEW);
    if (!current) return;
    return ok(res, permissionTree);
  },

  'GET /api/system/roles/:id/user-options': (req: any, res: any) => {
    const current = requirePermission(req, res, PERMISSION_CODES.ROLE_UPDATE);
    if (!current) return;

    const roleId = Number(req.params.id);
    const targetRole = roles.find((role) => role.id === roleId);
    if (!targetRole) {
      return fail(res, 404, '角色不存在');
    }

    const keyword = keywordOf(req.query.keyword);
    const limit = Math.min(
      200,
      Math.max(1, Number.parseInt(String(req.query.limit ?? 200), 10) || 200),
    );

    const list = users
      .filter((user) => {
        if (!keyword) return true;
        return [user.username, user.nickname]
          .join(' ')
          .toLowerCase()
          .includes(keyword);
      })
      .sort((left, right) => left.id - right.id)
      .slice(0, limit)
      .map((user) => ({
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        status: user.status,
        isMember: user.roleIds.includes(roleId),
        roles: roles
          .filter((role) => user.roleIds.includes(role.id))
          .sort((left, right) => left.id - right.id)
          .map(({ id, code, name }) => ({ id, code, name })),
      }));

    return ok(res, list);
  },

  'POST /api/system/roles/:id/members': (req: any, res: any) => {
    const current = requirePermission(req, res, PERMISSION_CODES.ROLE_UPDATE);
    if (!current) return;

    const roleId = Number(req.params.id);
    const targetRole = roles.find((role) => role.id === roleId);
    if (!targetRole) {
      return fail(res, 404, '角色不存在');
    }
    if (targetRole.code === 'super_admin' && !isSuperAdmin(current)) {
      return fail(res, 403, '只有超级管理员可以管理超级管理员角色成员');
    }

    const action = req.body?.action;
    const rawUserIds = req.body?.userIds;
    if (action !== 'add' && action !== 'remove') {
      return fail(res, 400, '操作类型不合法');
    }
    if (!Array.isArray(rawUserIds) || rawUserIds.length === 0) {
      return fail(res, 400, '请至少选择一个用户');
    }
    if (action === 'remove' && targetRole.code === 'super_admin') {
      return fail(res, 400, '不能批量移除超级管理员角色');
    }

    const userIds = Array.from(
      new Set(
        rawUserIds.map((value) => Number(value)).filter((value) => Number.isInteger(value)),
      ),
    );
    if (userIds.length !== rawUserIds.length) {
      return fail(res, 400, '用户 ID 必须为整数且不能重复');
    }

    const targetUsers = userIds
      .map((userId) => users.find((user) => user.id === userId))
      .filter((user): user is NonNullable<typeof user> => Boolean(user));
    if (targetUsers.length !== userIds.length) {
      return fail(res, 400, '部分用户不存在，请刷新后重试');
    }

    let affected = 0;
    targetUsers.forEach((user) => {
      const alreadyMember = user.roleIds.includes(roleId);
      if (action === 'add' && !alreadyMember) {
        user.roleIds.push(roleId);
        affected += 1;
      }
      if (action === 'remove' && alreadyMember) {
        user.roleIds = user.roleIds.filter((id) => id !== roleId);
        affected += 1;
      }
    });

    const userCount = users.filter((user) => user.roleIds.includes(roleId)).length;
    return ok(res, {
      success: true,
      action,
      affected,
      userCount,
    });
  },

  'POST /api/system/roles': (req: any, res: any) => {
    const current = requirePermission(req, res, PERMISSION_CODES.ROLE_CREATE);
    if (!current) return;

    const body = req.body ?? {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const description = optionalText(body.description, 100);
    const permissions = normalizePermissions(body.permissions);

    if (!name || name.length > 20) {
      return fail(res, 400, '角色名称不能为空且不能超过 20 个字符');
    }
    if (!ROLE_CODE_PATTERN.test(code)) {
      return fail(res, 400, '角色编码需为 3-32 位小写字母、数字或下划线，并以字母开头');
    }
    if (description === null) {
      return fail(res, 400, '角色说明不能超过 100 个字符');
    }
    if (!permissions) {
      return fail(res, 400, '请至少选择一项有效权限');
    }
    if (roles.some((role) => role.code.toLowerCase() === code.toLowerCase())) {
      return fail(res, 409, '角色编码已存在');
    }

    const created = {
      id: nextId(roles),
      name,
      code,
      description: description ?? '',
      permissions,
      isSystem: false,
      createdAt: new Date().toISOString(),
    };

    roles.push(created);
    return ok(res, toPublicRole(created));
  },

  'PUT /api/system/roles/:id': (req: any, res: any) => {
    const current = requirePermission(req, res, PERMISSION_CODES.ROLE_UPDATE);
    if (!current) return;

    const target = roles.find((role) => role.id === Number(req.params.id));
    if (!target) {
      return fail(res, 404, '角色不存在');
    }
    if (target.isSystem) {
      return fail(res, 400, '系统内置角色不可编辑');
    }

    const body = req.body ?? {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = optionalText(body.description, 100);
    const permissions = normalizePermissions(body.permissions);

    if (!name || name.length > 20) {
      return fail(res, 400, '角色名称不能为空且不能超过 20 个字符');
    }
    if (body.code && String(body.code).trim() !== target.code) {
      return fail(res, 400, '角色编码创建后不可修改');
    }
    if (description === null) {
      return fail(res, 400, '角色说明不能超过 100 个字符');
    }
    if (!permissions) {
      return fail(res, 400, '请至少选择一项有效权限');
    }

    target.name = name;
    target.description = description ?? '';
    target.permissions = permissions;

    return ok(res, toPublicRole(target));
  },

  'DELETE /api/system/roles/:id': (req: any, res: any) => {
    const current = requirePermission(req, res, PERMISSION_CODES.ROLE_DELETE);
    if (!current) return;

    const index = roles.findIndex((role) => role.id === Number(req.params.id));
    if (index === -1) {
      return fail(res, 404, '角色不存在');
    }

    const target = roles[index];
    if (target.isSystem) {
      return fail(res, 400, '系统内置角色不可删除');
    }

    const memberCount = users.filter((user) => user.roleIds.includes(target.id)).length;
    if (memberCount > 0) {
      return fail(res, 400, `该角色下还有 ${memberCount} 位成员，请先调整成员角色`);
    }

    roles.splice(index, 1);
    return ok(res, { success: true });
  },
};
