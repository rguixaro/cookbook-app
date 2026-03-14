import { db } from '@/server/db'
import { User } from '@/types'

/**
 * Gets a user by id
 * @param id
 * @returns Promise<User | null>
 */
export const getUserById = async (id: string | undefined): Promise<User | null> => {
	if (!id) return null
	try {
		return await db.user.findFirst({ where: { id } })
	} catch {
		return null
	}
}
