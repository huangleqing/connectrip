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
