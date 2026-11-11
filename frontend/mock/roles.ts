import { nextId, roles, toPublicRole, users } from './db';
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
