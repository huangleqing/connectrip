import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { AuthUser } from '../common/types/auth-user';
import { SUPER_ADMIN_ROLE_CODE } from '../common/constants/roles';
import { toApiUserStatus, toDbUserStatus } from '../common/constants/user-status';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UpdateUserStatusDto } from './dto/update-user-status.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';
import type { UserQueryDto } from './dto/user-query.dto';
import type { UserDto } from './users.types';

const userListInclude = Prisma.validator<Prisma.UserInclude>()({
  roles: {
    include: {
      role: true,
    },
  },
});

type UserWithRoleRecords = Prisma.UserGetPayload<{
  include: typeof userListInclude;
}>;

function toUserDto(user: UserWithRoleRecords): UserDto {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatar,
    email: user.email,
    phone: user.phone,
    roleIds: user.roles.map((userRole) => userRole.roleId),
    roles: user.roles.map((userRole) => ({
      id: userRole.role.id,
      code: userRole.role.code,
      name: userRole.role.name,
    })),
    status: toApiUserStatus(user.status),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

function sameIds(left: number[], right: number[]): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort((a, b) => a - b);
  const sortedRight = [...right].sort((a, b) => a - b);
  return sortedLeft.every((id, index) => id === sortedRight[index]);
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: UserQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const keyword = query.keyword?.trim();

    const where: Prisma.UserWhereInput = {};

    if (query.status) {
      where.status = toDbUserStatus(query.status);
    }

    if (query.roleCode) {
      where.roles = {
        some: {
          role: {
            code: query.roleCode,
          },
        },
      };
    }

    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { nickname: { contains: keyword } },
        { email: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: userListInclude,
        orderBy: { id: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      list: users.map(toUserDto),
      total,
      page,
      pageSize,
    };
  }

  async create(dto: CreateUserDto, currentUser: AuthUser) {
    const roles = await this.resolveRoles(dto.roleIds);
    this.assertCanAssignSuperAdmin(currentUser, roles);

    if (await this.prisma.user.findUnique({ where: { username: dto.username } })) {
      throw new ConflictException('登录账号已存在');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const status = toDbUserStatus(dto.status ?? 'active');

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        nickname: dto.nickname,
        email: dto.email || null,
        phone: dto.phone || null,
        passwordHash,
        status,
        roles: {
          create: roles.map((role) => ({
            role: { connect: { id: role.id } },
          })),
        },
      },
      include: userListInclude,
    });

    return toUserDto(user);
  }

  async update(id: number, dto: UpdateUserDto, currentUser: AuthUser) {
    const target = await this.findUserOrThrow(id);
    const roles = await this.resolveRoles(dto.roleIds);
    const targetRoles = target.roles.map((userRole) => userRole.role);
    const targetIsSuperAdmin = targetRoles.some(
      (role) => role.code === SUPER_ADMIN_ROLE_CODE,
    );

    this.assertCanAssignSuperAdmin(currentUser, roles);

    if (targetIsSuperAdmin && !currentUser.isSuperAdmin) {
      throw new ForbiddenException('只有超级管理员可以编辑超级管理员账号');
    }

    if (
      target.id === currentUser.id &&
      (!sameIds(dto.roleIds, target.roles.map((userRole) => userRole.roleId)) ||
        dto.status !== toApiUserStatus(target.status))
    ) {
      throw new BadRequestException('不能修改当前登录账号的角色或启用状态');
    }

    if (
      targetIsSuperAdmin &&
      !roles.some((role) => role.code === SUPER_ADMIN_ROLE_CODE)
    ) {
      throw new BadRequestException('不能移除超级管理员的核心角色');
    }

    if (targetIsSuperAdmin && dto.status === 'disabled') {
      throw new BadRequestException('超级管理员账号不能被停用');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        nickname: dto.nickname,
        email: dto.email || null,
        phone: dto.phone || null,
        status: toDbUserStatus(dto.status),
        roles: {
          deleteMany: {},
          create: roles.map((role) => ({
            role: { connect: { id: role.id } },
          })),
        },
      },
      include: userListInclude,
    });

    return toUserDto(user);
  }

  async updateStatus(
    id: number,
    dto: UpdateUserStatusDto,
    currentUser: AuthUser,
  ) {
    const target = await this.findUserOrThrow(id);
    const targetIsSuperAdmin = target.roles.some(
      (userRole) => userRole.role.code === SUPER_ADMIN_ROLE_CODE,
    );

    if (target.id === currentUser.id && dto.status === 'disabled') {
      throw new BadRequestException('不能停用当前登录账号');
    }

    if (targetIsSuperAdmin && dto.status === 'disabled') {
      throw new BadRequestException('超级管理员账号不能被停用');
    }

    if (targetIsSuperAdmin && !currentUser.isSuperAdmin) {
      throw new ForbiddenException('只有超级管理员可以修改超级管理员账号');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { status: toDbUserStatus(dto.status) },
      include: userListInclude,
    });

    return toUserDto(user);
  }

  async resetPassword(id: number, dto: ResetPasswordDto) {
    await this.findUserOrThrow(id);
    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { success: true };
  }

  async remove(id: number, currentUser: AuthUser) {
    const target = await this.findUserOrThrow(id);

    if (target.id === currentUser.id) {
      throw new BadRequestException('不能删除当前登录账号');
    }

    const targetIsSuperAdmin = target.roles.some(
      (userRole) => userRole.role.code === SUPER_ADMIN_ROLE_CODE,
    );
    if (targetIsSuperAdmin) {
      throw new BadRequestException('超级管理员账号不能被删除');
    }

    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  private async findUserOrThrow(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: userListInclude,
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  private async resolveRoles(roleIds: number[]): Promise<Role[]> {
    const uniqueIds = Array.from(new Set(roleIds));
    const roles = await this.prisma.role.findMany({
      where: { id: { in: uniqueIds } },
    });
    if (roles.length !== uniqueIds.length) {
      throw new BadRequestException('请至少选择一个有效角色');
    }
    return roles;
  }

  private assertCanAssignSuperAdmin(currentUser: AuthUser, roles: Role[]) {
    const assignsSuperAdmin = roles.some(
      (role) => role.code === SUPER_ADMIN_ROLE_CODE,
    );
    if (assignsSuperAdmin && !currentUser.isSuperAdmin) {
      throw new ForbiddenException('只有超级管理员可以分配超级管理员角色');
    }
  }
}
