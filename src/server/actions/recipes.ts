'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import * as Sentry from '@sentry/nextjs'

import { auth } from '@/auth'
import { db } from '@/server/db'
import {
	CreateRecipeSchema,
	isRecipeCourse,
	isRecipeCategory,
	normalizeRecipeSort,
	normalizeRecipeCourseAndCategories,
	type RecipeSchema,
} from '@/server/schemas'
import { formatLongSentence, slugify } from '@/server/utils'
import { toImageUrls } from '@/server/queries'

const PAGE_SIZE = 10

const getRecipePath = (username?: string | null, slug?: string | null) =>
	username && slug ? `/recipes/${username}/${slug}` : null

type RecipeWithAuthor = Prisma.RecipeGetPayload<{
	include: { author: { select: { username: true } } }
}>

const mapRecipe = (recipe: RecipeWithAuthor): RecipeSchema => {
	const { author, ...data } = recipe

	return {
		...data,
		...normalizeRecipeCourseAndCategories(recipe.course, recipe.categories),
		authorUsername: author?.username ?? '',
		images: toImageUrls(recipe.images),
	}
}

function sortRecipesByTime(
	recipes: RecipeWithAuthor[],
	direction: 'asc' | 'desc',
): RecipeWithAuthor[] {
	return [...recipes].sort((a, b) => {
		const aTime = a.time
		const bTime = b.time
		const aHasTime = typeof aTime === 'number'
		const bHasTime = typeof bTime === 'number'

		if (aHasTime && !bHasTime) return -1
		if (!aHasTime && bHasTime) return 1

		if (aHasTime && bHasTime && aTime !== bTime) {
			return direction === 'asc' ? aTime - bTime : bTime - aTime
		}

		const createdDiff = b.createdAt.getTime() - a.createdAt.getTime()
		if (createdDiff !== 0) return createdDiff

		return b.id.localeCompare(a.id)
	})
}

/**
 * Fetch paginated recipes with server-side filtering.
 * Auth required.
 */
export async function fetchRecipes(params: {
	cursor?: string
	take?: number
	search?: string
	course?: string
	categories?: string
	favourites?: boolean
	saved?: boolean
	userId?: string
	sort?: string
}): Promise<{ recipes: RecipeSchema[]; nextCursor: string | null }> {
	const empty = { recipes: [], nextCursor: null }
	const currentUser = await auth()
	if (!currentUser) return empty

	const {
		cursor,
		take = PAGE_SIZE,
		search,
		course,
		categories,
		favourites,
		saved,
		userId,
		sort,
	} = params
	const safeTake = Math.min(take, 50)
	const currentUserId = currentUser.user.id
	const recipeSort = normalizeRecipeSort(sort)

	if (userId && userId !== currentUserId) {
		const targetUser = await db.user.findUnique({
			where: { id: userId },
			select: { isPrivate: true },
		})
		if (!targetUser || targetUser.isPrivate) return empty
	}

	try {
		const authorFilter = userId ? { authorId: userId } : undefined

		let ownFeedOr: Prisma.RecipeWhereInput[] | undefined
		if (!userId) {
			const user = await db.user.findUnique({
				where: { id: currentUserId },
				select: { savedRecipes: true },
			})
			const savedIds = user?.savedRecipes ?? []
			ownFeedOr = savedIds.length
				? [
						{ authorId: currentUserId },
						{
							id: { in: savedIds },
							author: { isPrivate: false },
						},
					]
				: [{ authorId: currentUserId }]
		}

		let filteredRecipeIds: string[] | undefined
		if (favourites || saved) {
			const user = await db.user.findUnique({
				where: { id: currentUserId },
				select: {
					...(favourites && { favouriteRecipes: true }),
					...(saved && { savedRecipes: true }),
				},
			})

			const listFilters = [
				...(favourites ? [user?.favouriteRecipes ?? []] : []),
				...(saved ? [user?.savedRecipes ?? []] : []),
			]

			filteredRecipeIds = listFilters.reduce<string[] | undefined>(
				(acc, ids) => (acc ? acc.filter((id) => ids.includes(id)) : ids),
				undefined,
			)
			if (!filteredRecipeIds?.length) return empty
		}

		const categoryFilters = (categories ?? '')
			.split(',')
			.map((category) => category.trim())
			.filter(isRecipeCategory)
		const courseFilter = course && isRecipeCourse(course) ? course : undefined

		const where: Prisma.RecipeWhereInput = {
			...(authorFilter && { authorId: authorFilter.authorId }),
			...(ownFeedOr && { OR: ownFeedOr }),
			...(search && {
				name: {
					contains: search.slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
					mode: 'insensitive' as const,
				},
			}),
			...(courseFilter && { course: courseFilter }),
			...(categoryFilters.length && {
				categories: { hasSome: categoryFilters },
			}),
			...(filteredRecipeIds && { id: { in: filteredRecipeIds } }),
		}

		if (recipeSort === 'timeAsc' || recipeSort === 'timeDesc') {
			const candidates = await db.recipe.findMany({
				where,
				include: { author: { select: { username: true } } },
				orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
			})
			const sorted = sortRecipesByTime(
				candidates,
				recipeSort === 'timeAsc' ? 'asc' : 'desc',
			)
			const startIndex = cursor
				? Math.max(sorted.findIndex((recipe) => recipe.id === cursor) + 1, 0)
				: 0
			const results = sorted.slice(startIndex, startIndex + safeTake + 1)
			const hasMore = results.length > safeTake
			if (hasMore) results.pop()

			return {
				recipes: results.map(mapRecipe),
				nextCursor: hasMore ? (results[results.length - 1]?.id ?? null) : null,
			}
		}

		const results = await db.recipe.findMany({
			where,
			include: { author: { select: { username: true } } },
			orderBy:
				recipeSort === 'createdAtAsc'
					? [{ createdAt: 'asc' }, { id: 'asc' }]
					: [{ createdAt: 'desc' }, { id: 'desc' }],
			take: safeTake + 1,
			...(cursor && { cursor: { id: cursor }, skip: 1 }),
		})

		const hasMore = results.length > safeTake
		if (hasMore) results.pop()

		return {
			recipes: results.map(mapRecipe),
			nextCursor: hasMore ? (results[results.length - 1]?.id ?? null) : null,
		}
	} catch (error) {
		Sentry.captureException(error, { tags: { action: 'fetchRecipes' } })
		return empty
	}
}

interface createRecipeResult {
	error: boolean
	message?: string
	recipeId?: string
	recipePath?: string
}

/**
 * Create new recipe.
 * Auth required.
 * @param values {z.infer<typeof CreateRecipeSchema>}
 * @returns Promise<createRecipeResult>
 */
export const createRecipe = async (
	values: unknown,
): Promise<createRecipeResult> => {
	const currentUser = await auth()

	/** Not authenticated */
	if (!currentUser) return { error: true, message: 'error' }

	const parsed = CreateRecipeSchema.safeParse(values)
	if (!parsed.success) return { error: true, message: 'error' }

	const {
		name,
		course,
		categories,
		time,
		ingredients,
		instructions,
		sourceUrls,
	} = parsed.data

	const slug = slugify(name)
	if (!slug) return { error: true, message: 'error-recipe-name-invalid' }

	try {
		const recipe = await db.recipe.create({
			data: {
				name,
				course,
				categories,
				time,
				ingredients,
				instructions: formatLongSentence(instructions),
				sourceUrls: sourceUrls ?? [],
				authorId: currentUser.user.id,
				slug,
			},
			include: { author: { select: { username: true } } },
		})

		const recipePath = getRecipePath(recipe.author?.username, recipe.slug)
		revalidatePath('/')
		revalidatePath('/recipes')
		if (recipePath) revalidatePath(recipePath)

		return {
			error: false,
			recipeId: recipe.id,
			...(recipePath && { recipePath }),
		}
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			if (e.code === 'P2002') {
				return { error: true, message: 'error-recipe-exists' }
			}
		}
		Sentry.captureException(e, { tags: { action: 'createRecipe' } })
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

	const {
		name,
		course,
		categories,
		time,
		ingredients,
		instructions,
		sourceUrls,
	} = parsed.data

	const slug = slugify(name)
	if (!slug) return { error: true, message: 'error-recipe-name-invalid' }

	try {
		const recipe = await db.recipe.findFirst({
			where: { id, authorId: currentUser.user.id },
			include: { author: { select: { username: true } } },
		})

		if (!recipe) return { error: true, message: 'error' }

		await db.recipe.update({
			where: { id, authorId: currentUser.user.id },
			data: {
				name,
				course,
				categories,
				time,
				ingredients,
				instructions: formatLongSentence(instructions),
				sourceUrls: sourceUrls ?? [],
				slug,
			},
		})

		const username = recipe.author?.username
		const oldRecipePath = getRecipePath(username, recipe.slug)
		const recipePath = getRecipePath(username, slug)
		revalidatePath('/')
		revalidatePath('/recipes')
		if (oldRecipePath) revalidatePath(oldRecipePath)
		if (recipePath) revalidatePath(recipePath)

		return {
			error: false,
			recipeId: recipe.id,
			...(recipePath && { recipePath }),
		}
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			if (e.code === 'P2002') {
				return { error: true, message: 'error-recipe-exists' }
			}
		}
		Sentry.captureException(e, { tags: { action: 'updateRecipe' } })
		return { error: true, message: 'error' }
	}
}

/**
 * Save or remove from saved a recipe.
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
			const user = await db.user.findUnique({
				where: { id: userId },
				select: { savedRecipes: true },
			})
			if (user && user.savedRecipes.length >= 500) return { error: true }

			await db.user.updateMany({
				where: {
					id: userId,
					NOT: { savedRecipes: { has: id } },
				},
				data: { savedRecipes: { push: id } },
			})
		}

		revalidatePath('/')
		return { error: false }
	} catch (error) {
		Sentry.captureException(error, { tags: { action: 'saveRecipe' } })
		return { error: true }
	}
}

/**
 * Favourite or remove from favourites a recipe.
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
			const user = await db.user.findUnique({
				where: { id: userId },
				select: { favouriteRecipes: true },
			})
			if (user && user.favouriteRecipes.length >= 500) return { error: true }

			await db.user.updateMany({
				where: {
					id: userId,
					NOT: { favouriteRecipes: { has: id } },
				},
				data: { favouriteRecipes: { push: id } },
			})
		}

		revalidatePath('/')
		return { error: false }
	} catch (error) {
		Sentry.captureException(error, { tags: { action: 'favouriteRecipe' } })
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
			select: {
				images: true,
				slug: true,
				author: { select: { username: true } },
			},
		})
		if (!recipe) return { error: true }

		const username = recipe.author?.username
		const recipePath = getRecipePath(username, recipe.slug)
		const profilePath = username ? `/profiles/${username}` : null

		if (recipe.images.length > 0) {
			const { deleteRecipeImages } = await import('@/lib/s3')
			await deleteRecipeImages(recipe.images).catch((error) =>
				Sentry.captureException(error, {
					level: 'warning',
					tags: { action: 'deleteRecipe', step: 's3-cleanup' },
				}),
			)
		}

		await db.recipe.delete({
			where: { id, authorId: currentUser.user.id },
		})

		const affectedUsers = await db.user.findMany({
			where: {
				OR: [{ savedRecipes: { has: id } }, { favouriteRecipes: { has: id } }],
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
		).catch((error) =>
			Sentry.captureException(error, {
				level: 'warning',
				tags: { action: 'deleteRecipe', step: 'dangling-refs' },
			}),
		)

		revalidatePath('/')
		revalidatePath('/recipes')
		if (recipePath) revalidatePath(recipePath)
		if (profilePath) revalidatePath(profilePath)

		return { error: false }
	} catch (error) {
		Sentry.captureException(error, { tags: { action: 'deleteRecipe' } })
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
			select: {
				images: true,
				slug: true,
				author: { select: { username: true } },
			},
		})
		if (!recipe) return { error: true }

		const files = formData.getAll('images') as File[]
		if (!files.length) {
			Sentry.captureMessage('uploadRecipeImages: no files in FormData', {
				level: 'warning',
				tags: { action: 'uploadRecipeImages' },
			})
			return { error: true }
		}

		if (files.length > 3) {
			Sentry.captureMessage('uploadRecipeImages: too many files', {
				level: 'warning',
				tags: { action: 'uploadRecipeImages' },
			})
			return { error: true }
		}

		const { uploadRecipeImage, deleteRecipeImages } = await import('@/lib/s3')
		const fileKeys = await Promise.all(
			files.map((file) => uploadRecipeImage(file, recipeId)),
		)

		const freshRecipe = await db.recipe.findFirst({
			where: { id: recipeId, authorId: currentUser.user.id },
			select: {
				images: true,
				slug: true,
				author: { select: { username: true } },
			},
		})
		if (!freshRecipe) {
			Sentry.captureMessage(
				'uploadRecipeImages: race condition — recipe not found on re-fetch',
				{
					level: 'warning',
					tags: { action: 'uploadRecipeImages', step: 'race-check' },
				},
			)
			await deleteRecipeImages(fileKeys).catch((error) =>
				Sentry.captureException(error, {
					level: 'warning',
					tags: { action: 'uploadRecipeImages', step: 's3-rollback' },
				}),
			)
			return { error: true }
		}

		const updatedImages = [...freshRecipe.images, ...fileKeys]

		try {
			await db.recipe.update({
				where: { id: recipeId, authorId: currentUser.user.id },
				data: { images: updatedImages },
			})
		} catch (error) {
			Sentry.captureException(error, {
				tags: { action: 'uploadRecipeImages', step: 'db-persist' },
			})
			await deleteRecipeImages(fileKeys).catch((cleanupError) =>
				Sentry.captureException(cleanupError, {
					level: 'warning',
					tags: { action: 'uploadRecipeImages', step: 's3-rollback' },
				}),
			)
			return { error: true }
		}

		revalidatePath('/')
		revalidatePath('/recipes')
		const recipePath = getRecipePath(
			freshRecipe.author?.username,
			freshRecipe.slug,
		)
		if (recipePath) revalidatePath(recipePath)

		return { error: false, images: updatedImages }
	} catch (error) {
		Sentry.captureException(error, { tags: { action: 'uploadRecipeImages' } })
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
			select: {
				images: true,
				slug: true,
				author: { select: { username: true } },
			},
		})
		if (!recipe) return { error: true }

		if (images.length > 3) {
			Sentry.captureMessage('updateRecipeImages: images exceed max count', {
				level: 'warning',
				tags: { action: 'updateRecipeImages' },
			})
			return { error: true }
		}

		const invalidKeys = images.filter((key) => !recipe.images.includes(key))
		if (invalidKeys.length > 0) {
			Sentry.captureMessage('updateRecipeImages: invalid keys provided', {
				level: 'warning',
				tags: { action: 'updateRecipeImages' },
				extra: { invalidKeys },
			})
			return { error: true }
		}

		const removedKeys = recipe.images.filter((key) => !images.includes(key))
		if (removedKeys.length > 0) {
			const { deleteRecipeImages } = await import('@/lib/s3')
			await deleteRecipeImages(removedKeys).catch((error) =>
				Sentry.captureException(error, {
					level: 'warning',
					tags: { action: 'updateRecipeImages', step: 's3-cleanup' },
				}),
			)
		}

		await db.recipe.update({
			where: { id: recipeId, authorId: currentUser.user.id },
			data: { images },
		})

		revalidatePath('/')
		revalidatePath('/recipes')
		const recipePath = getRecipePath(recipe.author?.username, recipe.slug)
		if (recipePath) revalidatePath(recipePath)

		return { error: false }
	} catch (error) {
		Sentry.captureException(error, { tags: { action: 'updateRecipeImages' } })
		return { error: true }
	}
}
