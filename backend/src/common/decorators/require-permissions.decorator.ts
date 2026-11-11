import { SetMetadata } from '@nestjs/common';
import type { PermissionCode } from '../constants/permissions';

export const PERMISSIONS_KEY = 'requiredPermissions';

/** 声明接口需要的权限标识，支持多个（必须全部满足） */
export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
