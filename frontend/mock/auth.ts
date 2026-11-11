import { createToken, toCurrentUser, users } from './db';
import { fail, ok, requireAuth } from './helpers';

export default {
  'POST /api/auth/login': (req: any, res: any) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!username || !password) {
      return fail(res, 400, '请输入账号和密码');
    }

    const user = users.find((item) => item.username.toLowerCase() === username.toLowerCase());
    if (!user || user.password !== password) {
      return fail(res, 401, '账号或密码错误');
    }
    if (user.status !== 'active') {
      return fail(res, 403, '该账号已被停用，请联系管理员');
    }

    user.lastLoginAt = new Date().toISOString();

    return ok(res, {
      token: createToken(user.id),
      user: toCurrentUser(user),
    });
  },

  'GET /api/auth/me': (req: any, res: any) => {
    const user = requireAuth(req, res);
    if (!user) return;
    return ok(res, toCurrentUser(user));
  },

  'POST /api/auth/logout': (_req: any, res: any) => {
    return ok(res, { success: true });
  },
};
