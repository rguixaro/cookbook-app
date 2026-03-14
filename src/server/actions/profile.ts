'use server'

import { revalidatePath } from 'next/cache'

import { auth, signOut } from '@/auth'
import { db } from '@/server/db'
import { UpdateProfileSchema } from '@/server/schemas'

/**
 * Update Profile.
 * Auth required.
 * @param values {z.infer<typeof UpdateProfileSchema>}
 * @returns Promise<void | null>
 */
export const updateProfile = async (values: unknown): Promise<void | null> => {
	const currentUser = await auth()

	/** Not authenticated */
	if (!currentUser) return null

	const parsed = UpdateProfileSchema.safeParse(values)
	if (!parsed.success) return null

	const { name, isPrivate } = parsed.data

	try {
		await db.user.update({
			where: { id: currentUser.user.id },
			data: { name, isPrivate },
		})

		revalidatePath('/')
		revalidatePath('/profile')
	} catch {
		return null
	}
}

/**
 * Delete Profile.
 * Auth required.
 * @returns Promise<null | true>
 */
export const deleteProfile = async (): Promise<null | true> => {
	const currentUser = await auth()

	/** Not authenticated */
	if (!currentUser) return null

	try {
		await db.user.delete({ where: { id: currentUser.user.id } })
		await signOut()
		return true
	} catch {
		return null
	}
}
