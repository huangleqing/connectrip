import { IsIn } from 'class-validator';
import { USER_STATUS_VALUES, type ApiUserStatus } from '../../common/constants/user-status';

export class UpdateUserStatusDto {
  @IsIn(USER_STATUS_VALUES, { message: '账号状态不合法' })
  status: ApiUserStatus;
}
