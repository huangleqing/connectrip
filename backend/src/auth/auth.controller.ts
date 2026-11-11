import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly captchaService: CaptchaService,
  ) {}

  @Public()
  @Get('captcha')
  @Header('Cache-Control', 'no-store')
  captcha() {
    return this.captchaService.create();
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  me(@CurrentUser() currentUser: AuthUser) {
    return currentUser;
  }

  @Post('change-password')
  @HttpCode(200)
  changePassword(
    @CurrentUser() currentUser: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(currentUser.id, dto);
  }

  @Post('logout')
  @HttpCode(200)
  logout() {
    return { success: true };
  }
}
