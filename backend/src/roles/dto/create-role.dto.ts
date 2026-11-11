import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  ALL_PERMISSION_CODES,
  type PermissionCode,
} from '../../common/constants/permissions';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateRoleDto {
  @Transform(trimString)
  @IsString({ message: '角色名称必须为字符串' })
  @IsNotEmpty({ message: '请输入角色名称' })
  @MaxLength(20, { message: '角色名称最多 20 个字符' })
  name: string;

  @Transform(trimString)
  @IsString({ message: '角色编码必须为字符串' })
  @IsNotEmpty({ message: '请输入角色编码' })
  @Matches(/^[a-z][a-z0-9_]{2,31}$/, {
    message: '角色编码需为 3-32 位小写字母、数字或下划线，并以字母开头',
  })
  code: string;

  @Transform(trimString)
  @IsOptional()
  @IsString({ message: '角色说明必须为字符串' })
  @MaxLength(100, { message: '角色说明最多 100 个字符' })
  description?: string;

  @IsArray({ message: '权限列表必须为数组' })
  @ArrayNotEmpty({ message: '请至少选择一项权限' })
  @ArrayUnique({ message: '权限不能重复' })
  @IsIn(ALL_PERMISSION_CODES, { each: true, message: '包含无效的权限标识' })
  permissions: PermissionCode[];
}
