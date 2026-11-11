export interface RoleSummary {
  id: number;
  code: string;
  name: string;
}

export interface AuthUser {
  id: number;
  username: string;
  nickname: string;
  avatar?: string | null;
  email?: string | null;
  phone?: string | null;
  roles: RoleSummary[];
  permissions: string[];
  isSuperAdmin: boolean;
}

export interface JwtPayload {
  sub: number;
  username: string;
  iat?: number;
  exp?: number;
}
