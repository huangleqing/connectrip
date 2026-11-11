import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { buildCurrentUser, userWithRolesInclude } from '../common/utils/current-user';
import { CaptchaService } from './captcha.service';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly captchaService: CaptchaService,
  ) {}

  async login(dto: LoginDto) {
    this.captchaService.verify(dto.captchaId, dto.captchaCode);

    const username = dto.username.trim();
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: userWithRolesInclude,
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('账号或密码错误');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('该账号已被停用，请联系管理员');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
    });

    return {
      token,
      user: buildCurrentUser(user),
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new UnauthorizedException('登录状态已失效，请重新登录');
    }

    const currentPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.passwordHash,
    );
    if (!currentPasswordValid) {
      throw new BadRequestException('当前密码不正确');
    }

    if (await bcrypt.compare(dto.newPassword, user.passwordHash)) {
      throw new BadRequestException('新密码不能与当前密码相同');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true };
  }
}
