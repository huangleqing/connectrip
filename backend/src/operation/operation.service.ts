import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type OperationLine } from '@prisma/client';
import { PERMISSIONS } from '../common/constants/permissions';
import { SUPER_ADMIN_ROLE_CODE } from '../common/constants/roles';
import type { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateOperationLineDto,
  CreateTourDto,
  UpdateOperationLineDto,
  UpdateTourDto,
} from './dto/operation.dto';
import type { TourQueryDto } from './dto/tour-query.dto';
import type { OperationLineDto, TourGroupDto } from './operation.types';

const tourInclude = Prisma.validator<Prisma.TourGroupInclude>()({
  line: true,
});

type TourWithLine = Prisma.TourGroupGetPayload<{
  include: typeof tourInclude;
}>;

type OperationLineRecord = OperationLine & {
  _count?: { tours: number };
};

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function addDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

function toLineDto(line: OperationLineRecord): OperationLineDto {
  return {
    id: line.id,
    name: line.name,
    code: line.code,
    permissionCode: line.permissionCode,
    sort: line.sort,
    enabled: line.enabled,
    tourCount: line._count?.tours ?? 0,
  };
}

function toTourDto(tour: TourWithLine): TourGroupDto {
  return {
    id: tour.id,
    lineId: tour.lineId,
    line: toLineDto(tour.line),
    country: tour.line.name,
    countryCode: tour.line.code,
    stage: tour.stage,
    orderNo: tour.orderNo,
    tourNo: tour.tourNo,
    name: tour.name,
    flights: {
      outbound: tour.flightsOutbound,
      inbound: tour.flightsInbound,
    },
    source: tour.source,
    agency: tour.agency,
    people: {
      total: tour.peopleTotal,
      adults: tour.peopleAdults,
      children: tour.peopleChildren,
    },
    owner: tour.owner,
    assistant: tour.assistant,
    departureDate: tour.departureDate,
    returnDate: tour.returnDate,
    itinerary: tour.itinerary as unknown,
    operations: tour.operations as unknown,
    subcontract: tour.subcontract as unknown,
    hotels: tour.hotels as unknown,
    restaurants: tour.restaurants as unknown,
    fleet: tour.fleet as unknown,
    ticket: tour.ticket,
    visa: tour.visa,
    scenic: tour.scenic,
    performance: tour.performance,
    transport: tour.transport,
    createdAt: tour.createdAt.toISOString(),
    updatedAt: tour.updatedAt.toISOString(),
  };
}

function buildDefaultItinerary(departureDate: string, returnDate: string) {
  const start = parseDate(departureDate);
  const end = parseDate(returnDate);
  const totalDays = Math.max(
    1,
    Math.min(60, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1),
  );
  return Array.from({ length: totalDays }, (_, index) => {
    const date = addDays(start, index);
    return {
      day: `D${index + 1}`,
      date: `${String(date.getMonth() + 1).padStart(2, '0')}.${String(
        date.getDate(),
      ).padStart(2, '0')}`,
      content:
        index === 0
          ? '出发，抵达后入住酒店，具体行程待补充'
          : index === totalDays - 1
            ? '返程，送机，具体行程待补充'
            : '行程待补充',
    };
  });
}

function buildDefaultOperations() {
  const defaults = {
    subcontract: { state: 'pending', text: '待安排' },
    ticket: { state: 'pending', text: '待出票' },
    visa: { state: 'pending', text: '待办理' },
    hotel: { state: 'pending', text: '待安排' },
    restaurant: { state: 'pending', text: '待安排' },
    car: { state: 'pending', text: '待安排' },
    scenic: { state: 'pending', text: '待安排' },
    performance: { state: 'pending', text: '待安排' },
    transport: { state: 'pending', text: '待安排' },
  };
  return defaults;
}

function canViewAmount(user: AuthUser) {
  return (
    user.isSuperAdmin ||
    user.permissions.includes(PERMISSIONS.OPERATION_AMOUNT_VIEW)
  );
}

function mergeProtectedAmounts(
  existingValue: unknown,
  incomingValue: unknown,
  fields: string[],
): unknown {
  if (!Array.isArray(incomingValue)) return incomingValue;
  const existingRows = Array.isArray(existingValue) ? existingValue : [];
  const existingById = new Map(
    existingRows
      .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
      .map((row) => [row.id, row]),
  );

  return incomingValue.map((row) => {
    if (!row || typeof row !== 'object') return row;
    const next = { ...(row as Record<string, unknown>) };
    const previous = existingById.get(next.id);
    fields.forEach((field) => {
      next[field] = previous ? previous[field] ?? 0 : 0;
    });
    return next;
  });
}

function mergeProtectedSubcontract(
  existingValue: unknown,
  incomingValue: unknown,
): unknown {
  if (!incomingValue || typeof incomingValue !== 'object') return incomingValue;
  const current = incomingValue as Record<string, unknown>;
  const previousItems = Array.isArray(
    (existingValue as Record<string, unknown> | null)?.items,
  )
    ? ((existingValue as Record<string, unknown>).items as Array<
        Record<string, unknown>
      >)
    : [];
  const previousById = new Map(previousItems.map((item) => [item.id, item]));

  return {
    ...current,
    items: Array.isArray(current.items)
      ? current.items.map((item) => {
          if (!item || typeof item !== 'object') return item;
          const next = { ...(item as Record<string, unknown>) };
          const previous = previousById.get(next.id);
          next.unitPrice = previous ? previous.unitPrice ?? 0 : 0;
          return next;
        })
      : [],
  };
}

function maskAmountFields(value: unknown, fields: string[]): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((row) => {
    if (!row || typeof row !== 'object') return row;
    return fields.reduce(
      (next, field) => ({ ...next, [field]: 0 }),
      { ...(row as Record<string, unknown>) },
    );
  });
}

function maskTourAmounts(tour: TourGroupDto): TourGroupDto {
  const subcontract =
    tour.subcontract && typeof tour.subcontract === 'object'
      ? {
          ...(tour.subcontract as Record<string, unknown>),
          items: Array.isArray(
            (tour.subcontract as Record<string, unknown>).items,
          )
            ? (
                (tour.subcontract as Record<string, unknown>).items as Array<
                  Record<string, unknown>
                >
              ).map((item) => ({ ...item, unitPrice: 0 }))
            : [],
        }
      : tour.subcontract;

  return {
    ...tour,
    subcontract,
    hotels: maskAmountFields(tour.hotels, ['price', 'amount']),
    restaurants: maskAmountFields(tour.restaurants, ['standard', 'amount']),
    fleet: maskAmountFields(tour.fleet, ['amount']),
  };
}

function buildDefaultSubcontract(
  lineName: string,
  peopleTotal: number,
  adults: number,
  children: number,
) {
  return {
    agency: '',
    region: '',
    contact: '',
    phone: '',
    fax: '',
    shopName: '',
    payment: '默认付款',
    items: [
      { id: 'adult', name: '大人', count: adults, unitPrice: 0, remark: '' },
      { id: 'child', name: '小孩', count: children, unitPrice: 0, remark: '' },
      { id: 'guide', name: '全陪', count: 1, unitPrice: 0, remark: '' },
    ],
    pickup: `接 ${peopleTotal} 位贵宾`,
    notice: `${lineName}团队，请提前确认接站信息`,
    transport: '按航班时间安排接送',
  };
}

@Injectable()
export class OperationService {
  constructor(private readonly prisma: PrismaService) {}

  async getLines(
    user: AuthUser,
    includeDisabled = false,
  ): Promise<OperationLineDto[]> {
    const lines = await this.prisma.operationLine.findMany({
      where: {
        isDeleted: false,
        ...(includeDisabled ? {} : { enabled: true }),
      },
      include: {
        _count: {
          select: { tours: { where: { isDeleted: false } } },
        },
      },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });

    if (user.isSuperAdmin) {
      return lines.map(toLineDto);
    }

    const granted = new Set(user.permissions);
    return lines
      .filter((line) => granted.has(line.permissionCode))
      .map(toLineDto);
  }

  async createLine(
    dto: CreateOperationLineDto,
    user: AuthUser,
  ): Promise<OperationLineDto> {
    const code = dto.code.trim().toLowerCase();
    const name = dto.name.trim();
    const existing = await this.prisma.operationLine.findFirst({
      where: { OR: [{ code }, { name }] },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('线路名称或编码已存在');
    }

    const permissionCode = `operation:line:${code.replace(/[^a-z0-9]+/g, '_')}`;
    const existingPermission = await this.prisma.permission.findUnique({
      where: { code: permissionCode },
      select: { id: true },
    });
    if (existingPermission) {
      throw new ConflictException('线路权限编码已存在，请更换线路编码');
    }

    const maxSort = await this.prisma.operationLine.aggregate({
      _max: { sort: true },
    });
    const sort = dto.sort ?? (maxSort._max.sort ?? 0) + 10;
    const roleIds = new Set(user.roles.map((role) => role.id));

    const line = await this.prisma.$transaction(async (tx) => {
      const permission = await tx.permission.create({
        data: {
          code: permissionCode,
          name: `线路权限 · ${name}`,
          type: 'BUTTON',
          module: 'operation',
          sort: 1000 + sort,
        },
      });
      const created = await tx.operationLine.create({
        data: {
          name,
          code,
          permissionCode,
          sort,
          enabled: dto.enabled ?? true,
        },
      });

      const superAdmin = await tx.role.findUnique({
        where: { code: SUPER_ADMIN_ROLE_CODE },
        select: { id: true },
      });
      if (superAdmin) {
        roleIds.add(superAdmin.id);
      }

      if (roleIds.size) {
        await tx.rolePermission.createMany({
          data: Array.from(roleIds).map((roleId) => ({
            roleId,
            permissionId: permission.id,
          })),
          skipDuplicates: true,
        });
      }

      return created;
    });

    return toLineDto(line);
  }

  async updateLine(
    id: number,
    dto: UpdateOperationLineDto,
  ): Promise<OperationLineDto> {
    const existing = await this.prisma.operationLine.findUnique({
      where: { id },
    });
    if (!existing || existing.isDeleted) {
      throw new NotFoundException('线路不存在');
    }

    const name = dto.name?.trim();
    const code = dto.code?.trim().toLowerCase();
    if (name || code) {
      const conflict = await this.prisma.operationLine.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(name ? [{ name }] : []),
            ...(code ? [{ code }] : []),
          ],
        },
        select: { id: true },
      });
      if (conflict) {
        throw new ConflictException('线路名称或编码已存在');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const line = await tx.operationLine.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(code !== undefined ? { code } : {}),
          ...(dto.sort !== undefined ? { sort: dto.sort } : {}),
          ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
        },
      });
      if (name !== undefined) {
        await tx.permission.update({
          where: { code: existing.permissionCode },
          data: { name: `线路权限 · ${name}` },
        });
      }
      return line;
    });

    const tourCount = await this.prisma.tourGroup.count({
      where: { lineId: id, isDeleted: false },
    });
    return toLineDto({ ...updated, _count: { tours: tourCount } });
  }

  async deleteLine(id: number) {
    const line = await this.prisma.operationLine.findUnique({
      where: { id },
    });
    if (!line || line.isDeleted) {
      throw new NotFoundException('线路不存在');
    }

    const addedTourCount = await this.prisma.$transaction(async (tx) => {
      const affected = await tx.tourGroup.updateMany({
        where: { lineId: id, isDeleted: false },
        data: { isDeleted: true },
      });
      await tx.operationLine.update({
        where: { id },
        data: { isDeleted: true },
      });
      return affected.count;
    });

    return { success: true, affectedTours: addedTourCount };
  }

  async getTours(user: AuthUser, query: TourQueryDto): Promise<TourGroupDto[]> {
    const lines = await this.getLines(user);
    let lineIds = lines.map((line) => line.id);

    if (query.lineId !== undefined) {
      if (!lineIds.includes(query.lineId)) {
        return [];
      }
      lineIds = [query.lineId];
    }
    if (!lineIds.length) {
      return [];
    }

    const keyword = query.keyword?.trim();
    const where: Prisma.TourGroupWhereInput = {
      lineId: { in: lineIds },
      isDeleted: false,
      ...(query.stage ? { stage: query.stage } : {}),
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword } },
              { orderNo: { contains: keyword } },
              { tourNo: { contains: keyword } },
              { source: { contains: keyword } },
              { agency: { contains: keyword } },
              { owner: { contains: keyword } },
            ],
          }
        : {}),
    };

    const tours = await this.prisma.tourGroup.findMany({
      where,
      include: tourInclude,
      orderBy: [{ departureDate: 'asc' }, { id: 'asc' }],
    });

    const result = tours.map(toTourDto);
    return canViewAmount(user)
      ? result
      : result.map((tour) => maskTourAmounts(tour));
  }

  async getTour(id: number, user: AuthUser): Promise<TourGroupDto> {
    const tour = await this.prisma.tourGroup.findUnique({
      where: { id },
      include: tourInclude,
    });
    if (!tour || tour.isDeleted) {
      throw new NotFoundException('团队不存在');
    }
    await this.requireAccessibleLine(tour.lineId, user);

    const result = toTourDto(tour);
    return canViewAmount(user) ? result : maskTourAmounts(result);
  }

  async createTour(dto: CreateTourDto, user: AuthUser): Promise<TourGroupDto> {
    const line = await this.requireAccessibleLine(dto.lineId, user);
    const departure = parseDate(dto.departureDate);
    const returnDate = parseDate(dto.returnDate);
    if (returnDate < departure) {
      throw new BadRequestException('返程日期不能早于出团日期');
    }

    const orderNo = dto.orderNo?.trim()
      ? await this.ensureUniqueOrderNo(dto.orderNo.trim())
      : await this.generateOrderNo(dto.departureDate, line.code);
    const tourNo = dto.tourNo?.trim()
      ? await this.ensureUniqueTourNo(dto.tourNo.trim())
      : await this.generateTourNo(dto.departureDate, line.code);

    const itinerary =
      dto.itinerary && dto.itinerary.length
        ? dto.itinerary
        : buildDefaultItinerary(dto.departureDate, dto.returnDate);
    const operations = dto.operations ?? buildDefaultOperations();
    const amountVisible = canViewAmount(user);
    const subcontract = amountVisible
      ? dto.subcontract ??
        buildDefaultSubcontract(
          line.name,
          dto.peopleTotal,
          dto.peopleAdults,
          dto.peopleChildren,
        )
      : mergeProtectedSubcontract(
          { items: [] },
          dto.subcontract ??
            buildDefaultSubcontract(
              line.name,
              dto.peopleTotal,
              dto.peopleAdults,
              dto.peopleChildren,
            ),
        );
    const hotels = amountVisible
      ? dto.hotels ?? []
      : mergeProtectedAmounts([], dto.hotels ?? [], ['price', 'amount']);
    const restaurants = amountVisible
      ? dto.restaurants ?? []
      : mergeProtectedAmounts([], dto.restaurants ?? [], ['standard', 'amount']);
    const fleet = amountVisible
      ? dto.fleet ?? []
      : mergeProtectedAmounts([], dto.fleet ?? [], ['amount']);

    const tour = await this.prisma.tourGroup.create({
      data: {
        lineId: line.id,
        stage: dto.stage,
        orderNo,
        tourNo,
        name: dto.name.trim(),
        flightsOutbound: dto.flightsOutbound?.trim() ?? '',
        flightsInbound: dto.flightsInbound?.trim() ?? '',
        source: dto.source?.trim() ?? '',
        agency: dto.agency?.trim() ?? '',
        peopleTotal: dto.peopleTotal,
        peopleAdults: dto.peopleAdults,
        peopleChildren: dto.peopleChildren,
        owner: dto.owner?.trim() ?? '',
        assistant: dto.assistant?.trim() ?? '',
        departureDate: dto.departureDate,
        returnDate: dto.returnDate,
        itinerary: itinerary as Prisma.InputJsonValue,
        operations: operations as Prisma.InputJsonValue,
        subcontract: subcontract as Prisma.InputJsonValue,
        hotels: hotels as Prisma.InputJsonValue,
        restaurants: restaurants as Prisma.InputJsonValue,
        fleet: fleet as Prisma.InputJsonValue,
        ticket: dto.ticket?.trim() ?? '',
        visa: dto.visa?.trim() ?? '',
        scenic: dto.scenic?.trim() ?? '',
        performance: dto.performance?.trim() ?? '',
        transport: dto.transport?.trim() ?? '',
      },
      include: tourInclude,
    });

    const result = toTourDto(tour);
    return canViewAmount(user) ? result : maskTourAmounts(result);
  }

  async updateTour(
    id: number,
    dto: UpdateTourDto,
    user: AuthUser,
  ): Promise<TourGroupDto> {
    const existing = await this.prisma.tourGroup.findUnique({
      where: { id },
      include: tourInclude,
    });
    if (!existing || existing.isDeleted) {
      throw new NotFoundException('团队不存在');
    }
    await this.requireAccessibleLine(existing.lineId, user);
    if (dto.lineId !== undefined) {
      await this.requireAccessibleLine(dto.lineId, user);
    }
    const amountVisible = canViewAmount(user);
    const subcontractPatch =
      dto.subcontract === undefined
        ? undefined
        : amountVisible
          ? dto.subcontract
          : mergeProtectedSubcontract(existing.subcontract, dto.subcontract);
    const hotelsPatch =
      dto.hotels === undefined
        ? undefined
        : amountVisible
          ? dto.hotels
          : mergeProtectedAmounts(existing.hotels, dto.hotels, [
              'price',
              'amount',
            ]);
    const restaurantsPatch =
      dto.restaurants === undefined
        ? undefined
        : amountVisible
          ? dto.restaurants
          : mergeProtectedAmounts(existing.restaurants, dto.restaurants, [
              'standard',
              'amount',
            ]);
    const fleetPatch =
      dto.fleet === undefined
        ? undefined
        : amountVisible
          ? dto.fleet
          : mergeProtectedAmounts(existing.fleet, dto.fleet, ['amount']);

    const data: Prisma.TourGroupUpdateInput = {};
    if (dto.lineId !== undefined) {
      data.line = { connect: { id: dto.lineId } };
    }
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.stage !== undefined) data.stage = dto.stage;
    if (dto.departureDate !== undefined) data.departureDate = dto.departureDate;
    if (dto.returnDate !== undefined) data.returnDate = dto.returnDate;
    if (dto.flightsOutbound !== undefined)
      data.flightsOutbound = dto.flightsOutbound.trim();
    if (dto.flightsInbound !== undefined)
      data.flightsInbound = dto.flightsInbound.trim();
    if (dto.source !== undefined) data.source = dto.source.trim();
    if (dto.agency !== undefined) data.agency = dto.agency.trim();
    if (dto.peopleTotal !== undefined) data.peopleTotal = dto.peopleTotal;
    if (dto.peopleAdults !== undefined) data.peopleAdults = dto.peopleAdults;
    if (dto.peopleChildren !== undefined)
      data.peopleChildren = dto.peopleChildren;
    if (dto.owner !== undefined) data.owner = dto.owner.trim();
    if (dto.assistant !== undefined) data.assistant = dto.assistant.trim();
    if (dto.itinerary !== undefined)
      data.itinerary = dto.itinerary as Prisma.InputJsonValue;
    if (dto.operations !== undefined)
      data.operations = dto.operations as Prisma.InputJsonValue;
    if (dto.subcontract !== undefined)
      data.subcontract = subcontractPatch as Prisma.InputJsonValue;
    if (dto.hotels !== undefined)
      data.hotels = hotelsPatch as Prisma.InputJsonValue;
    if (dto.restaurants !== undefined)
      data.restaurants = restaurantsPatch as Prisma.InputJsonValue;
    if (dto.fleet !== undefined)
      data.fleet = fleetPatch as Prisma.InputJsonValue;
    if (dto.ticket !== undefined) data.ticket = dto.ticket.trim();
    if (dto.visa !== undefined) data.visa = dto.visa.trim();
    if (dto.scenic !== undefined) data.scenic = dto.scenic.trim();
    if (dto.performance !== undefined)
      data.performance = dto.performance.trim();
    if (dto.transport !== undefined) data.transport = dto.transport.trim();

    const tour = await this.prisma.tourGroup.update({
      where: { id },
      data,
      include: tourInclude,
    });
    const result = toTourDto(tour);
    return canViewAmount(user) ? result : maskTourAmounts(result);
  }

  async deleteTour(id: number, user: AuthUser) {
    const existing = await this.prisma.tourGroup.findUnique({
      where: { id },
      select: { id: true, lineId: true, isDeleted: true },
    });
    if (!existing || existing.isDeleted) {
      throw new NotFoundException('团队不存在');
    }
    await this.requireAccessibleLine(existing.lineId, user);
    await this.prisma.tourGroup.update({
      where: { id },
      data: { isDeleted: true },
    });
    return { success: true };
  }

  private async requireAccessibleLine(
    lineId: number,
    user: AuthUser,
  ): Promise<OperationLineRecord> {
    const line = await this.prisma.operationLine.findUnique({
      where: { id: lineId },
    });
    if (!line || line.isDeleted || !line.enabled) {
      throw new NotFoundException('线路不存在或已停用');
    }
    if (
      !user.isSuperAdmin &&
      !user.permissions.includes(line.permissionCode)
    ) {
      throw new ForbiddenException('当前账号无权操作该线路');
    }
    return line;
  }

  private async generateOrderNo(departureDate: string, lineCode: string) {
    const base = `${departureDate.replace(/-/g, '')}${lineCode
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase()}`;
    let candidate = base;
    let sequence = 1;
    while (
      await this.prisma.tourGroup.findUnique({
        where: { orderNo: candidate },
        select: { id: true },
      })
    ) {
      sequence += 1;
      candidate = `${base}${sequence}`;
    }
    return candidate;
  }

  private async ensureUniqueOrderNo(orderNo: string) {
    const existing = await this.prisma.tourGroup.findUnique({
      where: { orderNo },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('订单编号已存在');
    }
    return orderNo;
  }

  private async generateTourNo(departureDate: string, lineCode: string) {
    const base = `PTCKG-${departureDate
      .slice(2)
      .replace(/-/g, '')}-${lineCode
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 2)
      .toUpperCase()}`;
    let candidate = base;
    let sequence = 1;
    while (
      await this.prisma.tourGroup.findUnique({
        where: { tourNo: candidate },
        select: { id: true },
      })
    ) {
      sequence += 1;
      candidate = `${base}-${sequence}`;
    }
    return candidate;
  }

  private async ensureUniqueTourNo(tourNo: string) {
    const existing = await this.prisma.tourGroup.findUnique({
      where: { tourNo },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('团号已存在');
    }
    return tourNo;
  }
}
