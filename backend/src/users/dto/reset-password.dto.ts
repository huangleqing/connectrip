import { IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: '密码必须为字符串' })
  @Length(6, 32, { message: '新密码长度需为 6-32 位' })
  password: string;
}
