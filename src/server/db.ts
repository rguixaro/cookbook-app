import { PrismaClient } from '@prisma/client';

import { env } from '@/env.mjs';

const { NODE_ENV } = env;

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};
/**
 * Prisma database client
 */
export const db =
	globalForPrisma.prisma ??
	new PrismaClient({
		log: NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
	});

if (NODE_ENV !== 'production') globalForPrisma.prisma = db;
