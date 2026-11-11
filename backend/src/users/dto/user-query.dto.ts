import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { USER_STATUS_VALUES, type ApiUserStatus } from '../../common/constants/user-status';

export class UserQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '搜索关键字不能超过 50 个字符' })
  keyword?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32, { message: '角色编码不能超过 32 个字符' })
  roleCode?: string;

  @IsOptional()
  @IsIn(USER_STATUS_VALUES, { message: '状态参数不合法' })
  status?: ApiUserStatus;
}
