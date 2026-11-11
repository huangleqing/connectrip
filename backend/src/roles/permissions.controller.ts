import { Controller, Get } from '@nestjs/common';
import { PERMISSIONS } from '../common/constants/permissions';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { RolesService } from './roles.service';

@Controller('system')
export class PermissionsController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('permissions')
  @RequirePermissions(PERMISSIONS.ROLE_VIEW)
  getPermissionTree() {
    return this.rolesService.getPermissionTree();
  }
}
