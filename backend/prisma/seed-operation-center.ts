import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { seedOperationCenter } from './operation-center-seed';

const prisma = new PrismaClient();

seedOperationCenter(prisma)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
