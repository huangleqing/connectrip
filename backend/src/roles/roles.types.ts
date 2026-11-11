export interface RoleDto {
  id: number;
  name: string;
  code: string;
  description: string | null;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
  createdAt: string;
}

export interface RoleOptionDto {
  label: string;
  value: number;
  code: string;
}

export interface RoleUserOptionDto {
  id: number;
  username: string;
  nickname: string;
  status: 'active' | 'disabled';
  isMember: boolean;
  roles: Array<{
    id: number;
    code: string;
    name: string;
  }>;
}

export interface UpdateRoleMembersResultDto {
  success: boolean;
  action: 'add' | 'remove';
  affected: number;
  userCount: number;
}
