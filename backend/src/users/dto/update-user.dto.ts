import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { USER_STATUS_VALUES, type ApiUserStatus } from '../../common/constants/user-status';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateUserDto {
  @Transform(trimString)
  @IsString({ message: '用户昵称必须为字符串' })
  @IsNotEmpty({ message: '请输入用户昵称' })
  @MaxLength(20, { message: '用户昵称最多 20 个字符' })
  nickname: string;

  @Transform(trimString)
  @IsOptional()
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email?: string;

  @Transform(trimString)
  @IsOptional()
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入有效的手机号' })
  phone?: string;

  @IsArray({ message: '角色列表必须为数组' })
  @ArrayNotEmpty({ message: '请至少选择一个角色' })
  @ArrayUnique({ message: '角色不能重复' })
  @IsInt({ each: true, message: '角色 ID 必须为整数' })
  roleIds: number[];

  @IsIn(USER_STATUS_VALUES, { message: '账号状态不合法' })
  status: ApiUserStatus;
}
