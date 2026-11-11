import { IsNotEmpty, IsString, Length, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: '当前密码必须为字符串' })
  @IsNotEmpty({ message: '请输入当前密码' })
  @MaxLength(64, { message: '当前密码长度不能超过 64 个字符' })
  oldPassword: string;

  @IsString({ message: '新密码必须为字符串' })
  @Length(6, 32, { message: '新密码长度需为 6-32 位' })
  newPassword: string;
}
