import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: '请输入账号' })
  @IsNotEmpty({ message: '请输入账号' })
  @MaxLength(50, { message: '账号长度不能超过 50 个字符' })
  username: string;

  @IsString({ message: '请输入密码' })
  @IsNotEmpty({ message: '请输入密码' })
  @MaxLength(64, { message: '密码长度不能超过 64 个字符' })
  password: string;

  @IsString({ message: '验证码标识必须为字符串' })
  @IsNotEmpty({ message: '请刷新验证码' })
  captchaId: string;

  @IsString({ message: '请输入验证码' })
  @IsNotEmpty({ message: '请输入验证码' })
  @MaxLength(10, { message: '验证码格式不正确' })
  captchaCode: string;
}
