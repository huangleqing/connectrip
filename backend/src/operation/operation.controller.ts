import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PERMISSIONS } from '../common/constants/permissions';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import type { AuthUser } from '../common/types/auth-user';
import {
  CreateOperationLineDto,
  CreateTourDto,
  UpdateOperationLineDto,
  UpdateTourDto,
} from './dto/operation.dto';
import { OperationLineQueryDto } from './dto/operation-line-query.dto';
import { TourQueryDto } from './dto/tour-query.dto';
import { OperationService } from './operation.service';

@Controller('operation')
export class OperationController {
  constructor(private readonly operationService: OperationService) {}

  @Get('lines')
  @RequirePermissions(PERMISSIONS.OPERATION_VIEW)
  getLines(
    @CurrentUser() user: AuthUser,
    @Query() query: OperationLineQueryDto,
  ) {
    return this.operationService.getLines(user, query.includeDisabled);
  }

  @Post('lines')
  @RequirePermissions(PERMISSIONS.OPERATION_LINE_CONFIG_CREATE)
  createLine(
    @Body() dto: CreateOperationLineDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.operationService.createLine(dto, user);
  }

  @Patch('lines/:id')
  @RequirePermissions(PERMISSIONS.OPERATION_LINE_CONFIG_UPDATE)
  updateLine(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOperationLineDto,
  ) {
    return this.operationService.updateLine(id, dto);
  }

  @Delete('lines/:id')
  @RequirePermissions(PERMISSIONS.OPERATION_LINE_CONFIG_DELETE)
  deleteLine(@Param('id', ParseIntPipe) id: number) {
    return this.operationService.deleteLine(id);
  }

  @Get('tours')
  @RequirePermissions(PERMISSIONS.OPERATION_VIEW)
  getTours(@CurrentUser() user: AuthUser, @Query() query: TourQueryDto) {
    return this.operationService.getTours(user, query);
  }

  @Get('tours/:id')
  @RequirePermissions(PERMISSIONS.OPERATION_VIEW)
  getTour(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.operationService.getTour(id, user);
  }

  @Post('tours')
  @RequirePermissions(PERMISSIONS.OPERATION_TOUR_CREATE)
  createTour(@Body() dto: CreateTourDto, @CurrentUser() user: AuthUser) {
    return this.operationService.createTour(dto, user);
  }

  @Patch('tours/:id')
  @RequirePermissions(PERMISSIONS.OPERATION_TOUR_UPDATE)
  updateTour(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTourDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.operationService.updateTour(id, dto, user);
  }

  @Delete('tours/:id')
  @RequirePermissions(PERMISSIONS.OPERATION_TOUR_DELETE)
  deleteTour(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.operationService.deleteTour(id, user);
  }
}
