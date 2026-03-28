'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { auth } from '@/auth'
import { db } from '@/server/db'
import { Categories, CreateRecipeSchema, type RecipeSchema } from '@/server/schemas'
import { formatLongSentence, slugify } from '@/server/utils'
import { toImageUrls } from '@/server/queries'

const PAGE_SIZE = 10

/**
 * Fetch paginated recipes with server-side filtering.
 * Auth required.
 */
export async function fetchRecipes(params: {
	cursor?: string
	take?: number
	search?: string
	category?: string
	favourites?: boolean
	userId?: string
}): Promise<{ recipes: RecipeSchema[]; nextCursor: string | null }> {
	const empty = { recipes: [], nextCursor: null }
	const currentUser = await auth()
	if (!currentUser) return empty

	const { cursor, take = PAGE_SIZE, search, category, favourites, userId } = params
	const safeTake = Math.min(take, 50)
	const currentUserId = currentUser.user.id

	// If viewing another user's recipes, check privacy
	if (userId && userId !== currentUserId) {
		const targetUser = await db.user.findUnique({
			where: { id: userId },
			select: { isPrivate: true },
		})
		if (!targetUser || targetUser.isPrivate) return empty
	}

	try {
		// Build base where clause
		const authorFilter = userId ? { authorId: userId } : undefined

		// For own feed (no userId): merge own + saved recipes
		let ownFeedOr: Prisma.RecipeWhereInput[] | undefined
		if (!userId) {
			const user = await db.user.findUnique({
				where: { id: currentUserId },
				select: { savedRecipes: true },
			})
			const savedIds = user?.savedRecipes ?? []
			ownFeedOr = savedIds.length
				? [{ authorId: currentUserId }, { id: { in: savedIds } }]
				: [{ authorId: currentUserId }]
		}

		// Favourites filter
		let favouriteIds: string[] | undefined
		if (favourites) {
			const user = await db.user.findUnique({
				where: { id: currentUserId },
				select: { favouriteRecipes: true },
			})
			favouriteIds = user?.favouriteRecipes ?? []
			if (favouriteIds.length === 0) return empty
		}

		const where: Prisma.RecipeWhereInput = {
			...(authorFilter && { authorId: authorFilter.authorId }),
			...(ownFeedOr && { OR: ownFeedOr }),
			...(search && {
				name: {
					contains: search.slice(0, 50),
					mode: 'insensitive' as const,
				},
			}),
			...(category &&
				(Categories as readonly string[]).includes(category) && {
					category: category as (typeof Categories)[number],
				}),
			...(favouriteIds && { id: { in: favouriteIds } }),
		}

		const results = await db.recipe.findMany({
			where,
			include: { author: { select: { username: true } } },
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
			take: safeTake + 1,
			...(cursor && { cursor: { id: cursor }, skip: 1 }),
		})

		const hasMore = results.length > safeTake
		if (hasMore) results.pop()

		const recipes: RecipeSchema[] = results.map((r) => ({
			...r,
			authorUsername: r.author?.username ?? '',
			author: undefined,
			images: toImageUrls(r.images),
		}))

		return {
			recipes,
			nextCursor: hasMore ? (results[results.length - 1]?.id ?? null) : null,
		}
	} catch {
		return empty
	}
}

interface createRecipeResult {
	error: boolean
	message?: string
	recipeId?: string
}

/**
 * Create new recipe.
 * Auth required.
 * @param values {z.infer<typeof CreateRecipeSchema>}
 * @returns Promise<createRecipeResult>
 */
export const createRecipe = async (values: unknown): Promise<createRecipeResult> => {
	const currentUser = await auth()

	/** Not authenticated */
	if (!currentUser) return { error: true, message: 'error' }

	const parsed = CreateRecipeSchema.safeParse(values)
	if (!parsed.success) return { error: true, message: 'error' }

	const { name, category, time, ingredients, instructions, sourceUrls } =
		parsed.data

	const slug = slugify(name)
	if (!slug) return { error: true, message: 'error-recipe-name-invalid' }

	try {
		const recipe = await db.recipe.create({
			data: {
				name,
				category,
				time,
				ingredients,
				instructions: formatLongSentence(instructions),
				sourceUrls: sourceUrls ?? [],
				authorId: currentUser.user.id,
				slug,
			},
		})

		revalidatePath('/')
		revalidatePath('/recipes')

		return { error: false, recipeId: recipe.id }
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			if (e.code === 'P2002') {
				return { error: true, message: 'error-recipe-exists' }
			}
		}
		return { error: true, message: 'error' }
	}
}

/**
 * Update an existing recipe.
 * Auth required.
 * @param id Recipe id
 * @param values {z.infer<typeof CreateRecipeSchema>}
 * @returns Promise<createRecipeResult>
 */
export const updateRecipe = async (
	id: string,
	values: unknown,
): Promise<createRecipeResult> => {
	const currentUser = await auth()

	/** Not authenticated */
	if (!currentUser) return { error: true, message: 'error' }

	const parsed = CreateRecipeSchema.safeParse(values)
	if (!parsed.success) return { error: true, message: 'error' }

	const { name, category, time, ingredients, instructions, sourceUrls } =
		parsed.data

	const slug = slugify(name)
	if (!slug) return { error: true, message: 'error-recipe-name-invalid' }

	try {
		const recipe = await db.recipe.findFirst({
			where: { id, authorId: currentUser.user.id },
		})

		if (!recipe) return { error: true, message: 'error' }

		await db.recipe.update({
			where: { id, authorId: currentUser.user.id },
			data: {
				name,
				category,
				time,
				ingredients,
				instructions: formatLongSentence(instructions),
				sourceUrls: sourceUrls ?? [],
				slug,
			},
		})
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			if (e.code === 'P2002') {
				return { error: true, message: 'error-recipe-exists' }
			}
		}
		return { error: true, message: 'error' }
	}

	revalidatePath('/')
	revalidatePath('/recipes')

	return { error: false }
}

/**
 * Save or unsave recipe.
 * Auth required.
 * @param id {string}
 * @param isSaved {boolean} - true if recipe is saved, false if unsaved
 * @returns Promise<{ error: boolean }>
 */
export const saveRecipe = async (
	id: string,
	isSaved: boolean,
): Promise<{ error: boolean }> => {
	const currentUser = await auth()

	/** Not authenticated */
	if (!currentUser) return { error: true }

	try {
		/** Validate that the recipe exists */
		const recipe = await db.recipe.findUnique({ where: { id } })
		if (!recipe) return { error: true }

		const userId = currentUser.user.id

		if (isSaved) {
			/** Unsave: remove from savedRecipes and favouriteRecipes */
			const user = await db.user.findUnique({
				where: { id: userId },
				select: { savedRecipes: true, favouriteRecipes: true },
			})
			if (!user) return { error: true }

			await db.user.update({
				where: { id: userId },
				data: {
					savedRecipes: {
						set: user.savedRecipes.filter((r) => r !== id),
					},
					favouriteRecipes: {
						set: user.favouriteRecipes.filter((r) => r !== id),
					},
				},
			})
		} else {
			/** Save: add to savedRecipes if not already present */
			const user = await db.user.findUnique({
				where: { id: userId },
				select: { savedRecipes: true },
			})
			if (!user) return { error: true }

			if (!user.savedRecipes.includes(id)) {
				await db.user.update({
					where: { id: userId },
					data: { savedRecipes: { push: id } },
				})
			}
		}

		return { error: false }
	} catch {
		return { error: true }
	}
}

/**
 * Favourite or unfavourite recipe.
 * Auth required.
 * @param id {string}
 * @param isFavourited {boolean} - true if recipe is already favourited
 * @returns Promise<{ error: boolean }>
 */
export const favouriteRecipe = async (
	id: string,
	isFavourited: boolean,
): Promise<{ error: boolean }> => {
	const currentUser = await auth()

	/** Not authenticated */
	if (!currentUser) return { error: true }

	try {
		/** Validate that the recipe exists */
		const recipe = await db.recipe.findUnique({ where: { id } })
		if (!recipe) return { error: true }

		const userId = currentUser.user.id

		if (isFavourited) {
			/** Unfavourite: remove from favouriteRecipes */
			const user = await db.user.findUnique({
				where: { id: userId },
				select: { favouriteRecipes: true },
			})
			if (!user) return { error: true }

			await db.user.update({
				where: { id: userId },
				data: {
					favouriteRecipes: {
						set: user.favouriteRecipes.filter((r) => r !== id),
					},
				},
			})
		} else {
			/** Favourite: add to favouriteRecipes if not already present */
			const user = await db.user.findUnique({
				where: { id: userId },
				select: { favouriteRecipes: true },
			})
			if (!user) return { error: true }

			if (!user.favouriteRecipes.includes(id)) {
				await db.user.update({
					where: { id: userId },
					data: { favouriteRecipes: { push: id } },
				})
			}
		}

		return { error: false }
	} catch {
		return { error: true }
	}
}

/**
 * Delete recipe.
 * Auth required.
 * @param id {string}
 * @returns Promise<{ error: boolean }>
 */
export const deleteRecipe = async (id: string): Promise<{ error: boolean }> => {
	const currentUser = await auth()

	/** Not authenticated */
	if (!currentUser) return { error: true }

	try {
		const recipe = await db.recipe.findFirst({
			where: { id, authorId: currentUser.user.id },
			select: { images: true },
		})
		if (!recipe) return { error: true }

		if (recipe.images.length > 0) {
			const { deleteRecipeImages } = await import('@/lib/s3')
			await deleteRecipeImages(recipe.images).catch((e) =>
				console.error('[S3] Failed to delete recipe images:', e),
			)
		}

		await db.recipe.delete({
			where: { id, authorId: currentUser.user.id },
		})

		// Clean dangling references from all users' savedRecipes and favouriteRecipes
		const affectedUsers = await db.user.findMany({
			where: {
				OR: [
					{ savedRecipes: { has: id } },
					{ favouriteRecipes: { has: id } },
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
							set: user.savedRecipes.filter((r) => r !== id),
						},
						favouriteRecipes: {
							set: user.favouriteRecipes.filter((r) => r !== id),
						},
					},
				}),
			),
		).catch(() => {})

		revalidatePath('/recipes')

		return { error: false }
	} catch {
		return { error: true }
	}
}

/**
 * Upload images for a recipe (max 3).
 * Auth required. Validates recipe ownership.
 * @param recipeId Recipe id
 * @param formData FormData containing image files under key "images"
 * @returns Promise<{ error: boolean; images?: string[] }>
 */
export const uploadRecipeImages = async (
	recipeId: string,
	formData: FormData,
): Promise<{ error: boolean; images?: string[] }> => {
	const currentUser = await auth()
	if (!currentUser) return { error: true }

	try {
		const recipe = await db.recipe.findFirst({
			where: { id: recipeId, authorId: currentUser.user.id },
			select: { images: true },
		})
		if (!recipe) return { error: true }

		const files = formData.getAll('images') as File[]
		if (!files.length) return { error: true }

		const totalImages = recipe.images.length + files.length
		if (totalImages > 3) return { error: true }

		const { uploadRecipeImage } = await import('@/lib/s3')
		const fileKeys = await Promise.all(
			files.map((file) => uploadRecipeImage(file, recipeId)),
		)

		const updatedImages = [...recipe.images, ...fileKeys]

		await db.recipe.update({
			where: { id: recipeId, authorId: currentUser.user.id },
			data: { images: updatedImages },
		})

		revalidatePath('/')
		revalidatePath('/recipes')

		return { error: false, images: updatedImages }
	} catch {
		return { error: true }
	}
}

/**
 * Update recipe images (reorder, remove, or replace).
 * Auth required.
 * @param recipeId Recipe id
 * @param images New image keys array (already-uploaded keys to keep)
 */
export const updateRecipeImages = async (
	recipeId: string,
	images: string[],
): Promise<{ error: boolean }> => {
	const currentUser = await auth()
	if (!currentUser) return { error: true }

	try {
		const recipe = await db.recipe.findFirst({
			where: { id: recipeId, authorId: currentUser.user.id },
			select: { images: true },
		})
		if (!recipe) return { error: true }

		// Validate that every provided key actually belongs to this recipe
		const invalidKeys = images.filter((key) => !recipe.images.includes(key))
		if (invalidKeys.length > 0) return { error: true }

		// Delete removed images from S3
		const removedKeys = recipe.images.filter((key) => !images.includes(key))
		if (removedKeys.length > 0) {
			const { deleteRecipeImages } = await import('@/lib/s3')
			await deleteRecipeImages(removedKeys).catch(() => {})
		}

		await db.recipe.update({
			where: { id: recipeId, authorId: currentUser.user.id },
			data: { images },
		})

		revalidatePath('/')
		revalidatePath('/recipes')

		return { error: false }
	} catch {
		return { error: true }
	}
}
