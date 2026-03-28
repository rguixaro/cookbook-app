'use server'

import { revalidatePath } from 'next/cache'

import { auth, signOut, unstable_update } from '@/auth'
import { db } from '@/server/db'
import { UpdateProfileSchema } from '@/server/schemas'
import { deleteRecipeImages } from '@/lib/s3'

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

		await unstable_update({ user: { name, isPrivate } })
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
		// Collect all S3 image keys before Prisma cascade-deletes the recipes
		const recipes = await db.recipe.findMany({
			where: { authorId: currentUser.user.id },
			select: { images: true },
		})
		const allImageKeys = recipes.flatMap((r) => r.images)
		if (allImageKeys.length > 0) {
			await deleteRecipeImages(allImageKeys).catch((e) =>
				console.error(
					'[S3] Failed to delete user images on profile deletion:',
					e,
				),
			)
		}

		await db.user.delete({ where: { id: currentUser.user.id } })
		await signOut()
		return true
	} catch {
		return null
	}
}
