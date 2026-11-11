import { createMockCaptcha, verifyMockCaptcha } from './captcha';
import { createToken, toCurrentUser, users } from './db';
import { fail, ok, requireAuth } from './helpers';

export default {
  'GET /api/auth/captcha': (_req: any, res: any) => {
    return ok(res, createMockCaptcha());
  },

  'POST /api/auth/login': (req: any, res: any) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const captchaId = typeof req.body?.captchaId === 'string' ? req.body.captchaId : '';
    const captchaCode =
      typeof req.body?.captchaCode === 'string' ? req.body.captchaCode : '';

    if (!username || !password) {
      return fail(res, 400, '请输入账号和密码');
    }
    if (!captchaId || !captchaCode) {
      return fail(res, 400, '请输入验证码');
    }
    if (!verifyMockCaptcha(captchaId, captchaCode)) {
      return fail(res, 400, '验证码错误或已过期，请刷新验证码');
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
