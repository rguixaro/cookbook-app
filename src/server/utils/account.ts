import { db } from '@/server/db';
import { Account } from '@/types';

/**
 * Get an account by user id
 * @param userId
 * @returns Promise<Account | null>
 */
export const getAccountByUserId = async (
	userId: string
): Promise<Account | null> => {
	try {
		return await db.account.findFirst({ where: { userId } });
	} catch {
		return null;
	}
};
