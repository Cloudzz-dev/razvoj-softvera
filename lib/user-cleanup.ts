import { prisma } from "@/lib/prisma";

/**
 * Cleanup a specific user if their scheduled deletion date has passed.
 * Called during login attempts to handle immediate cleanup.
 * 
 * @param email - Email of the user to check
 * @returns true if user was deleted, false otherwise
 */
export async function cleanupExpiredUser(email: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                deletedAt: true,
                scheduledDeletionAt: true,
            },
        });

        // User doesn't exist or isn't soft-deleted
        if (!user || !user.scheduledDeletionAt) {
            return false;
        }

        // Check if scheduled deletion date has passed
        const now = new Date();
        if (user.scheduledDeletionAt <= now) {
            // Permanently delete the user (cascade will handle related records)
            await prisma.user.delete({
                where: { id: user.id },
            });

            console.log(`[CLEANUP] Permanently deleted expired user: ${email}`);
            return true;
        }

        return false;
    } catch (error) {
        console.error(`[CLEANUP] Error checking user ${email}:`, error);
        return false;
    }
}

/**
 * Cleanup all users whose scheduled deletion date has passed.
 * Called opportunistically from high-traffic routes (1% chance).
 * 
 * @returns Number of users deleted
 */
export async function cleanupAllExpiredUsers(): Promise<number> {
    try {
        const now = new Date();

        // Find all users past their scheduled deletion date
        const expiredUsers = await prisma.user.findMany({
            where: {
                scheduledDeletionAt: {
                    lte: now,
                },
            },
            select: {
                id: true,
                email: true,
            },
            take: 100, // Limit batch size to avoid timeout
        });

        if (expiredUsers.length === 0) {
            return 0;
        }

        // Delete users in a transaction for safety
        const deletedCount = await prisma.$transaction(async (tx) => {
            let count = 0;
            for (const user of expiredUsers) {
                await tx.user.delete({
                    where: { id: user.id },
                });
                count++;
            }
            return count;
        });

        console.log(`[CLEANUP] Permanently deleted ${deletedCount} expired users`);
        return deletedCount;
    } catch (error) {
        console.error("[CLEANUP] Error cleaning up expired users:", error);
        return 0;
    }
}

/**
 * Check if cleanup should run (1% probability)
 * @returns true if cleanup should run
 */
export function shouldRunCleanup(): boolean {
    return Math.random() < 0.01; // 1% chance
}
