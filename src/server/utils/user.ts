import { db } from '@/server/db';
import { User } from '@/types';

/**
 * Gets a user by email
 * @param email
 * @returns Promise<User | null>
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
	try {
		return await db.user.findFirst({ where: { email } });
	} catch {
		return null;
	}
};

/**
 * Gets a user by id
 * @param id
 * @returns Promise<User | null>
 */
export const getUserById = async (id: string | undefined): Promise<User | null> => {
	try {
		return await db.user.findFirst({ where: { id } });
	} catch {
		return null;
	}
};
