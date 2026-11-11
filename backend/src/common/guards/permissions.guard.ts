import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import type { PermissionCode } from '../constants/permissions';
import type { RequestWithUser } from '../types/request-with-user';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionCode[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.authUser;

    if (!user) {
      throw new UnauthorizedException('请先登录');
    }

    if (user.isSuperAdmin) {
      return true;
    }

    const granted = new Set(user.permissions);
    const allowed = requiredPermissions.every((permission) => granted.has(permission));

    if (!allowed) {
      throw new ForbiddenException('当前账号无权执行该操作');
    }

    return true;
  }
}
