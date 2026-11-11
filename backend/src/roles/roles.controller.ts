import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PERMISSIONS } from '../common/constants/permissions';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleQueryDto } from './dto/role-query.dto';
import { RoleUserOptionsQueryDto } from './dto/role-user-options-query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateRoleMembersDto } from './dto/update-role-members.dto';
import { RolesService } from './roles.service';

@Controller('system/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ROLE_VIEW)
  findAll(@Query() query: RoleQueryDto) {
    return this.rolesService.findAll(query);
  }

  @Get('options')
  getOptions() {
    return this.rolesService.getOptions();
  }

  @Get(':id/user-options')
  @RequirePermissions(PERMISSIONS.ROLE_UPDATE)
  getUserOptions(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: RoleUserOptionsQueryDto,
  ) {
    return this.rolesService.getUserOptions(id, query);
  }

  @Post()
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.ROLE_CREATE)
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Post(':id/members')
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.ROLE_UPDATE)
  updateMembers(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleMembersDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.rolesService.updateMembers(id, dto, currentUser);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.ROLE_UPDATE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ROLE_DELETE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }
}
