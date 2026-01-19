import { PrismaClient } from '@prisma/client';
// import { env } from '@/lib/env'; // REMOVED: Unused after moving to process.env

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Use process.env directly to avoid triggering full env validation on import
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
