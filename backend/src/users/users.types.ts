import type { RoleSummary } from '../common/types/auth-user';
import type { ApiUserStatus } from '../common/constants/user-status';

export interface UserDto {
  id: number;
  username: string;
  nickname: string;
  avatar?: string | null;
  email?: string | null;
  phone?: string | null;
  roleIds: number[];
  roles: RoleSummary[];
  status: ApiUserStatus;
  lastLoginAt: string | null;
  createdAt: string;
}
