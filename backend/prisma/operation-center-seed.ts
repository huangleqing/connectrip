import { PermissionType, Prisma, PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import {
  BUILTIN_OPERATION_LINES,
  type BuiltinOperationLine,
} from '../src/common/constants/permissions';
import { SUPER_ADMIN_ROLE_CODE } from '../src/common/constants/roles';

interface SeedTour {
  stage: string;
  orderNo: string;
  tourNo: string;
  name: string;
  country: string;
  flights: { outbound: string; inbound: string };
  source: string;
  agency: string;
  people: { total: number; adults: number; children: number };
  owner: string;
  assistant: string;
  departureDate: string;
  returnDate: string;
  itinerary: unknown;
  operations: unknown;
  subcontract: unknown;
  hotels: unknown;
  restaurants: unknown;
  fleet: unknown;
  ticket?: string;
  visa?: string;
  scenic?: string;
  performance?: string;
  transport?: string;
}

const toursFile = path.join(__dirname, 'data', 'operation-tours.json');

function permissionName(line: BuiltinOperationLine) {
  return `线路权限 · ${line.name}`;
}

export async function seedOperationCenter(prisma: PrismaClient) {
  const lineByName = new Map<string, { id: number; name: string }>();

  for (const line of BUILTIN_OPERATION_LINES) {
    const permission = await prisma.permission.upsert({
      where: { code: line.permissionCode },
      update: {
        name: permissionName(line),
        type: PermissionType.BUTTON,
        module: 'operation',
        sort: 1000 + line.sort,
      },
      create: {
        code: line.permissionCode,
        name: permissionName(line),
        type: PermissionType.BUTTON,
        module: 'operation',
        sort: 1000 + line.sort,
      },
    });

    const savedLine = await prisma.operationLine.upsert({
      where: { code: line.code },
      update: {
        name: line.name,
        permissionCode: line.permissionCode,
        sort: line.sort,
        enabled: true,
      },
      create: {
        name: line.name,
        code: line.code,
        permissionCode: line.permissionCode,
        sort: line.sort,
        enabled: true,
      },
    });
    if (!savedLine.isDeleted) {
      lineByName.set(savedLine.name, { id: savedLine.id, name: savedLine.name });
    }

    const superAdminRole = await prisma.role.findUnique({
      where: { code: SUPER_ADMIN_ROLE_CODE },
      select: { id: true },
    });
    if (superAdminRole) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  let tourCount = 0;
  if (fs.existsSync(toursFile)) {
    const tours = JSON.parse(fs.readFileSync(toursFile, 'utf8')) as SeedTour[];
    for (const tour of tours) {
      const line = lineByName.get(tour.country);
      if (!line) continue;
      const existing = await prisma.tourGroup.findUnique({
        where: { orderNo: tour.orderNo },
        select: { id: true },
      });
      if (existing) continue;

      await prisma.tourGroup.create({
        data: {
          lineId: line.id,
          stage: tour.stage,
          orderNo: tour.orderNo,
          tourNo: tour.tourNo,
          name: tour.name,
          flightsOutbound: tour.flights.outbound,
          flightsInbound: tour.flights.inbound,
          source: tour.source,
          agency: tour.agency,
          peopleTotal: tour.people.total,
          peopleAdults: tour.people.adults,
          peopleChildren: tour.people.children,
          owner: tour.owner,
          assistant: tour.assistant,
          departureDate: tour.departureDate,
          returnDate: tour.returnDate,
          itinerary: tour.itinerary as Prisma.InputJsonValue,
          operations: tour.operations as Prisma.InputJsonValue,
          subcontract: tour.subcontract as Prisma.InputJsonValue,
          hotels: tour.hotels as Prisma.InputJsonValue,
          restaurants: tour.restaurants as Prisma.InputJsonValue,
          fleet: tour.fleet as Prisma.InputJsonValue,
          ticket: tour.ticket ?? '',
          visa: tour.visa ?? '',
          scenic: tour.scenic ?? '',
          performance: tour.performance ?? '',
          transport: tour.transport ?? '',
        },
      });
      tourCount += 1;
    }
  }

  const superAdminRole = await prisma.role.findUnique({
    where: { code: SUPER_ADMIN_ROLE_CODE },
    select: { id: true },
  });
  if (superAdminRole) {
    const allPermissions = await prisma.permission.findMany({
      select: { id: true },
    });
    await prisma.rolePermission.createMany({
      data: allPermissions.map((permission) => ({
        roleId: superAdminRole.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });
  }

  console.log(
    `操作中心初始化完成：${BUILTIN_OPERATION_LINES.length} 条内置线路，新增 ${tourCount} 个样例团队。`,
  );
}
