import { UserStatus } from '@prisma/client';

export const USER_STATUS_VALUES = ['active', 'disabled'] as const;

export type ApiUserStatus = (typeof USER_STATUS_VALUES)[number];

export function toApiUserStatus(status: UserStatus): ApiUserStatus {
  return status === UserStatus.ACTIVE ? 'active' : 'disabled';
}

export function toDbUserStatus(status: ApiUserStatus): UserStatus {
  return status === 'active' ? UserStatus.ACTIVE : UserStatus.DISABLED;
}
