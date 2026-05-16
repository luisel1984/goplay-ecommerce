import { PrismaClient } from '@prisma/client';
import { isProd } from './env.js';
export const prisma = global.__prisma ?? new PrismaClient({
    log: isProd ? ['error'] : ['warn', 'error'],
});
if (!isProd)
    global.__prisma = prisma;
