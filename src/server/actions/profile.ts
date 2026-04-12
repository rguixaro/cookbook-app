'use server'

import { revalidatePath } from 'next/cache'
import * as Sentry from '@sentry/nextjs'

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
		revalidatePath('/profiles', 'layout')
	} catch (error) {
		Sentry.captureException(error, { tags: { action: 'updateProfile' } })
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
		const recipes = await db.recipe.findMany({
			where: { authorId: currentUser.user.id },
			select: { id: true, images: true },
		})
		const recipeIds = recipes.map((r) => r.id)
		const allImageKeys = recipes.flatMap((r) => r.images)

		if (allImageKeys.length > 0) {
			await deleteRecipeImages(allImageKeys).catch((error) =>
				Sentry.captureException(error, {
					level: 'warning',
					tags: { action: 'deleteProfile', step: 's3-cleanup' },
				}),
			)
		}

		if (recipeIds.length > 0) {
			const affectedUsers = await db.user.findMany({
				where: {
					OR: [
						{ savedRecipes: { hasSome: recipeIds } },
						{ favouriteRecipes: { hasSome: recipeIds } },
					],
				},
				select: { id: true, savedRecipes: true, favouriteRecipes: true },
			})

			await Promise.all(
				affectedUsers.map((user) =>
					db.user.update({
						where: { id: user.id },
						data: {
							savedRecipes: {
								set: user.savedRecipes.filter(
									(r) => !recipeIds.includes(r),
								),
							},
							favouriteRecipes: {
								set: user.favouriteRecipes.filter(
									(r) => !recipeIds.includes(r),
								),
							},
						},
					}),
				),
			).catch((error) =>
				Sentry.captureException(error, {
					level: 'warning',
					tags: { action: 'deleteProfile', step: 'dangling-refs' },
				}),
			)
		}

		await db.user.delete({ where: { id: currentUser.user.id } })
		await signOut()
		return true
	} catch (error) {
		Sentry.captureException(error, { tags: { action: 'deleteProfile' } })
		return null
	}
}
