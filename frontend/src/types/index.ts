export type UserStatus = 'active' | 'disabled';

export type PermissionType = 'group' | 'menu' | 'button';

export interface PermissionNode {
  key: string;
  title: string;
  type: PermissionType;
  children?: PermissionNode[];
}

export interface RoleBrief {
  id: number;
  code: string;
  name: string;
}

export interface CurrentUser {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  phone?: string;
  roles: RoleBrief[];
  permissions: string[];
  isSuperAdmin: boolean;
}

export interface User {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  phone?: string;
  roleIds: number[];
  roles: RoleBrief[];
  status: UserStatus;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface Role {
  id: number;
  name: string;
  code: string;
  description?: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
  createdAt: string;
}

export interface RoleOption {
  label: string;
  value: number;
  code: string;
}

export interface RoleUserOption {
  id: number;
  username: string;
  nickname: string;
  status: UserStatus;
  isMember: boolean;
  roles: RoleBrief[];
}

export interface UpdateRoleMembersParams {
  action: 'add' | 'remove';
  userIds: number[];
}

export interface UpdateRoleMembersResult {
  success: boolean;
  action: 'add' | 'remove';
  affected: number;
  userCount: number;
}

export interface PageQuery {
  page: number;
  pageSize: number;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LoginParams {
  username: string;
  password: string;
  captchaId: string;
  captchaCode: string;
}

export interface CaptchaResult {
  captchaId: string;
  image: string;
  expiresIn: number;
}

export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
}

export interface LoginResult {
  token: string;
  user: CurrentUser;
}

export interface DashboardSummary {
  userCount: number;
  activeUserCount: number;
  roleCount: number;
  permissionCount: number;
  todayOperations: number;
  systemStatus: 'operational' | 'maintenance';
  recentUsers: Array<{
    id: number;
    nickname: string;
    username: string;
    roles: RoleBrief[];
    status: UserStatus;
    lastLoginAt?: string | null;
  }>;
}

export interface InitialState {
  currentUser?: CurrentUser;
  permissions: string[];
  fetchUserInfo: () => Promise<CurrentUser>;
}

export interface UserQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  roleCode?: string;
  status?: UserStatus;
}

export interface RoleQuery {
  page: number;
  pageSize: number;
  keyword?: string;
}

export interface CreateUserParams {
  username: string;
  nickname: string;
  password: string;
  email?: string;
  phone?: string;
  roleIds: number[];
  status?: UserStatus;
}

export interface UpdateUserParams {
  nickname: string;
  email?: string;
  phone?: string;
  roleIds: number[];
  status?: UserStatus;
}

export interface SaveRoleParams {
  name: string;
  code: string;
  description?: string;
  permissions: string[];
}
