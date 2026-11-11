import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
} from 'class-validator';

export class UpdateRoleMembersDto {
  @IsIn(['add', 'remove'], { message: '操作类型不合法' })
  action: 'add' | 'remove';

  @IsArray({ message: '用户列表必须为数组' })
  @ArrayNotEmpty({ message: '请至少选择一个用户' })
  @ArrayUnique({ message: '用户不能重复' })
  @IsInt({ each: true, message: '用户 ID 必须为整数' })
  userIds: number[];
}
