import { PERMISSIONS } from '@/constants/permissions';
import type { InitialState } from '@/types';

/**
 * Umi access 插件入口。
 * - 返回对象中的布尔字段可直接被路由配置的 access 字符串使用
 * - hasPermission 用于 <Access accessible={...}> 与 useAccess()
 */
export default function access(initialState: InitialState | undefined) {
  const permissionSet = new Set(initialState?.permissions ?? []);

  const permissionFlags = Array.from(permissionSet).reduce<Record<string, boolean>>((flags, code) => {
    flags[code] = true;
    return flags;
  }, {});

  const hasPermission = (permission: string | string[], mode: 'all' | 'any' = 'all') => {
    const codes = Array.isArray(permission) ? permission : [permission];
    if (codes.length === 0) return true;
    return mode === 'all' ? codes.every((code) => permissionSet.has(code)) : codes.some((code) => permissionSet.has(code));
  };

  return {
    ...permissionFlags,
    isLoggedIn: Boolean(initialState?.currentUser),
    isSuperAdmin: Boolean(initialState?.currentUser?.isSuperAdmin),
    canAccessSystem: hasPermission([PERMISSIONS.USER_VIEW, PERMISSIONS.ROLE_VIEW], 'any'),
    hasPermission,
  };
}
