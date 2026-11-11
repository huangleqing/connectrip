import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../types/auth-user';
import type { RequestWithUser } from '../types/request-with-user';

/** 获取当前请求的登录用户（JwtAuthGuard 已从数据库加载最新角色权限） */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.authUser as AuthUser;
  },
);
