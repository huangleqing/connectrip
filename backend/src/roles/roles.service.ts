import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ALL_PERMISSION_CODES,
  buildPermissionTree,
  type PermissionCode,
} from '../common/constants/permissions';
import { SUPER_ADMIN_ROLE_CODE } from '../common/constants/roles';
import { toApiUserStatus } from '../common/constants/user-status';
import type { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateRoleDto } from './dto/create-role.dto';
import type { RoleQueryDto } from './dto/role-query.dto';
import type { RoleUserOptionsQueryDto } from './dto/role-user-options-query.dto';
import type { UpdateRoleDto } from './dto/update-role.dto';
import type { UpdateRoleMembersDto } from './dto/update-role-members.dto';
import type {
  RoleDto,
  RoleOptionDto,
  RoleUserOptionDto,
  UpdateRoleMembersResultDto,
} from './roles.types';

const roleDetailInclude = Prisma.validator<Prisma.RoleInclude>()({
  permissions: {
    include: {
      permission: true,
    },
  },
  _count: {
    select: {
      users: true,
    },
  },
});

type RoleWithRelations = Prisma.RoleGetPayload<{
  include: typeof roleDetailInclude;
}>;

function toRoleDto(role: RoleWithRelations): RoleDto {
  const codes = new Set(
    role.permissions.map((rolePermission) => rolePermission.permission.code),
  );

  return {
    id: role.id,
    name: role.name,
    code: role.code,
    description: role.description,
    permissions: ALL_PERMISSION_CODES.filter((code) => codes.has(code)),
    userCount: role._count.users,
    isSystem: role.isSystem,
    createdAt: role.createdAt.toISOString(),
  };
}

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: RoleQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const keyword = query.keyword?.trim();

    const where: Prisma.RoleWhereInput = keyword
      ? {
          OR: [
            { name: { contains: keyword } },
            { code: { contains: keyword } },
            { description: { contains: keyword } },
          ],
        }
      : {};

    const [total, roles] = await Promise.all([
      this.prisma.role.count({ where }),
      this.prisma.role.findMany({
        where,
        include: roleDetailInclude,
        orderBy: { id: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      list: roles.map(toRoleDto),
      total,
      page,
      pageSize,
    };
  }

  async getOptions(): Promise<RoleOptionDto[]> {
    const roles = await this.prisma.role.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, name: true, code: true },
    });

    return roles.map((role) => ({
      label: role.name,
      value: role.id,
      code: role.code,
    }));
  }

  getPermissionTree() {
    return buildPermissionTree();
  }

  async getUserOptions(
    roleId: number,
    query: RoleUserOptionsQueryDto,
  ): Promise<RoleUserOptionDto[]> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true },
    });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    const keyword = query.keyword?.trim();
    const users = await this.prisma.user.findMany({
      where: keyword
        ? {
            OR: [
              { username: { contains: keyword } },
              { nickname: { contains: keyword } },
            ],
          }
        : {},
      select: {
        id: true,
        username: true,
        nickname: true,
        status: true,
        roles: {
          select: {
            role: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
      take: query.limit ?? 200,
    });

    return users.map((user) => {
      const roles = user.roles
        .map((userRole) => userRole.role)
        .sort((left, right) => left.id - right.id);
      return {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        status: toApiUserStatus(user.status),
        isMember: roles.some((item) => item.id === roleId),
        roles,
      };
    });
  }

  async updateMembers(
    roleId: number,
    dto: UpdateRoleMembersDto,
    currentUser: AuthUser,
  ): Promise<UpdateRoleMembersResultDto> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true, code: true },
    });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    if (role.code === SUPER_ADMIN_ROLE_CODE && !currentUser.isSuperAdmin) {
      throw new ForbiddenException('只有超级管理员可以管理超级管理员角色成员');
    }
    if (role.code === SUPER_ADMIN_ROLE_CODE && dto.action === 'remove') {
      throw new BadRequestException('不能批量移除超级管理员角色');
    }

    const userIds = Array.from(new Set(dto.userIds));
    const existingUserCount = await this.prisma.user.count({
      where: { id: { in: userIds } },
    });
    if (existingUserCount !== userIds.length) {
      throw new BadRequestException('部分用户不存在，请刷新后重试');
    }

    let affected = 0;
    if (dto.action === 'add') {
      const result = await this.prisma.userRole.createMany({
        data: userIds.map((userId) => ({ roleId, userId })),
        skipDuplicates: true,
      });
      affected = result.count;
    } else {
      const result = await this.prisma.userRole.deleteMany({
        where: {
          roleId,
          userId: { in: userIds },
        },
      });
      affected = result.count;
    }

    const userCount = await this.prisma.userRole.count({
      where: { roleId },
    });

    return {
      success: true,
      action: dto.action,
      affected,
      userCount,
    };
  }

  async create(dto: CreateRoleDto) {
    if (await this.prisma.role.findUnique({ where: { code: dto.code } })) {
      throw new ConflictException('角色编码已存在');
    }

    const permissions = await this.resolvePermissions(dto.permissions);

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description || null,
        isSystem: false,
        permissions: {
          create: permissions.map((permission) => ({
            permission: { connect: { id: permission.id } },
          })),
        },
      },
      include: roleDetailInclude,
    });

    return toRoleDto(role);
  }

  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.findRoleOrThrow(id);
    if (role.isSystem) {
      throw new BadRequestException('系统内置角色不可编辑');
    }
    if (dto.code && dto.code !== role.code) {
      throw new BadRequestException('角色编码创建后不可修改');
    }

    const permissions = await this.resolvePermissions(dto.permissions);

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description || null,
        permissions: {
          deleteMany: {},
          create: permissions.map((permission) => ({
            permission: { connect: { id: permission.id } },
          })),
        },
      },
      include: roleDetailInclude,
    });

    return toRoleDto(updated);
  }

  async remove(id: number) {
    const role = await this.findRoleOrThrow(id);
    if (role.isSystem) {
      throw new BadRequestException('系统内置角色不可删除');
    }

    if (role._count.users > 0) {
      throw new BadRequestException(
        `该角色下还有 ${role._count.users} 位成员，请先调整成员角色`,
      );
    }

    await this.prisma.role.delete({ where: { id } });
    return { success: true };
  }

  private async findRoleOrThrow(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: roleDetailInclude,
    });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    return role;
  }

  private async resolvePermissions(codes: PermissionCode[]) {
    const uniqueCodes = Array.from(new Set(codes));
    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: uniqueCodes } },
    });

    if (permissions.length !== uniqueCodes.length) {
      throw new BadRequestException('权限数据未初始化，请先执行数据库种子脚本');
    }

    return permissions;
  }
}
