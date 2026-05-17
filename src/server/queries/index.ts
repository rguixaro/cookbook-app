import { cache } from 'react'
import { Prisma } from '@prisma/client'
import * as Sentry from '@sentry/nextjs'

import { auth } from '@/auth'
import { db } from '@/server/db'
import {
	isRecipeCategory,
	isRecipeCourse,
	normalizeRecipeSort,
	normalizeRecipeCourseAndCategories,
	type RecipeSchema,
} from '../schemas'
import {
	getCurrentRecipeLocale,
	type RecipeLocale,
} from '@/server/recipes/locale'
import {
	mapRecipeToSchema,
	recipeSchemaInclude,
	resolveRecipeTranslation,
	type RecipeWithTranslationsAndAuthor,
} from '@/server/recipes/translation'

const CLOUDFRONT_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN
const PAGE_SIZE = 10

const isAbsoluteHttpUrl = (value: string) => /^https?:\/\//i.test(value)

/** Convert S3 file keys to full CloudFront URLs */
export function toImageUrls(keys: string[]): string[] {
	return keys.flatMap((key) => {
		if (isAbsoluteHttpUrl(key)) return [key]
		if (!CLOUDFRONT_DOMAIN) return []
		return [`${CLOUDFRONT_DOMAIN}/${key}`]
	})
}

/**
 * Convert a recipe from the database to the RecipeSchema used in the app.
 * @param recipe
 * @returns RecipeSchema
 */
function toRecipeSchema(
	recipe: RecipeWithTranslationsAndAuthor,
	locale: RecipeLocale,
): RecipeSchema {
	return mapRecipeToSchema(recipe, locale, toImageUrls(recipe.images))
}

function buildRecipeSearchWhere(search?: string): Prisma.RecipeWhereInput {
	if (!search?.trim()) return {}

	return {
		translations: {
			some: {
				name: {
					contains: search
						.slice(0, 50)
						.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
					mode: 'insensitive',
				},
			},
		},
	}
}

function buildRecipeFilterWhere(params: {
	search?: string
	course?: string
	categories?: string
}): Prisma.RecipeWhereInput {
	const categoryFilters = (params.categories ?? '')
		.split(',')
		.map((category) => category.trim())
		.filter(isRecipeCategory)
	const courseFilter =
		params.course && isRecipeCourse(params.course) ? params.course : undefined

	return {
		...buildRecipeSearchWhere(params.search),
		...(courseFilter && { course: courseFilter }),
		...(categoryFilters.length && { categories: { hasSome: categoryFilters } }),
	}
}

function sortRecipesByTime(
	recipes: RecipeWithTranslationsAndAuthor[],
	direction: 'asc' | 'desc',
): RecipeWithTranslationsAndAuthor[] {
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
 * Get a user by username.
 * @param username
 * @returns Promise<{ id: string; username: string } | null>
 */
export const getUserByUsername = cache(async (username: string) => {
	try {
		return await db.user.findUnique({
			where: { username },
			select: { id: true, username: true },
		})
	} catch (error) {
		Sentry.captureException(error, { tags: { query: 'getUserByUsername' } })
		return null
	}
})

/**
 * Get saved recipe IDs for the current user.
 * Auth required.
 * @returns Promise<string[]>
 */
export const getSavedRecipeIds = cache(async (): Promise<string[]> => {
	const currentUser = await auth()
	if (!currentUser) return []

	try {
		const user = await db.user.findUnique({
			where: { id: currentUser.user.id },
			select: { savedRecipes: true },
		})
		return user?.savedRecipes ?? []
	} catch (error) {
		Sentry.captureException(error, { tags: { query: 'getSavedRecipeIds' } })
		return []
	}
})

/**
 * Get favourite recipe IDs for the current user.
 * Auth required.
 * @returns Promise<string[]>
 */
export const getFavouriteRecipeIds = cache(async (): Promise<string[]> => {
	const currentUser = await auth()
	if (!currentUser) return []

	try {
		const user = await db.user.findUnique({
			where: { id: currentUser.user.id },
			select: { favouriteRecipes: true },
		})
		return user?.favouriteRecipes ?? []
	} catch (error) {
		Sentry.captureException(error, {
			tags: { query: 'getFavouriteRecipeIds' },
		})
		return []
	}
})

/**
 * Get aggregate stats for a recipe.
 */
export const getRecipeStats = cache(async (recipeId: string) => {
	try {
		const [savedCount, favouriteCount] = await Promise.all([
			db.user.count({
				where: { savedRecipes: { has: recipeId } },
			}),
			db.user.count({
				where: { favouriteRecipes: { has: recipeId } },
			}),
		])

		return { savedCount, favouriteCount }
	} catch (error) {
		Sentry.captureException(error, { tags: { query: 'getRecipeStats' } })
		return { savedCount: 0, favouriteCount: 0 }
	}
})

/**
 * Get recipes by userId.
 * Auth required.
 * @returns Promise<{ recipes: Recipe[] } | null>
 */
export const getRecipesByUserId = cache(async (userId?: string) => {
	const currentUser = await auth()

	/** Not authenticated */
	if (!currentUser) return null

	const authorId = userId || currentUser.user?.id

	if (userId && userId !== currentUser.user?.id) {
		const targetUser = await db.user.findUnique({
			where: { id: userId },
			select: { isPrivate: true },
		})
		if (!targetUser || targetUser.isPrivate) return null
	}

	try {
		const locale = await getCurrentRecipeLocale()
		let savedRecipes: RecipeSchema[] = []
		const rawRecipes = await db.recipe.findMany({
			where: {
				authorId,
				...(userId && userId !== currentUser.user.id
					? { visibility: 'public' as const }
					: {}),
			},
			include: recipeSchemaInclude,
		})
		const recipes = rawRecipes.map((recipe) => toRecipeSchema(recipe, locale))

		if (!userId) {
			const savedIds = await getSavedRecipeIds()
			if (savedIds.length) {
				const rawSaved = await db.recipe.findMany({
					where: {
						id: { in: savedIds },
						OR: [
							{ authorId: currentUser.user.id },
							{ visibility: 'showcase' },
							{
								visibility: 'public',
								author: { isPrivate: false },
							},
						],
					},
					include: recipeSchemaInclude,
				})
				savedRecipes = rawSaved.map((recipe) =>
					toRecipeSchema(recipe, locale),
				)
			}
		}

		return { recipes: [...recipes, ...savedRecipes] }
	} catch (error) {
		throw error
	}
})

/**
 * Get recipe by author and slug.
 * Auth required.
 * @param authorId Recipe author id
 * @param slug Recipe slug
 * @returns Promise<Recipe | null>
 */
export const getRecipeByAuthAndSlug = cache(
	async (authorId: string, slug: string) => {
		const currentUser = await auth()

		/** Not authenticated */
		if (!currentUser) return null

		if (authorId !== currentUser.user?.id) {
			const author = await db.user.findUnique({
				where: { id: authorId },
				select: { isPrivate: true },
			})
			if (!author || author.isPrivate) return null
		}

		try {
			const recipe = await db.recipe.findFirst({
				where: {
					authorId,
					slug,
					...(authorId !== currentUser.user?.id
						? { visibility: 'public' as const }
						: {}),
				},
				include: recipeSchemaInclude,
			})
			if (!recipe) return null
			return toRecipeSchema(recipe, await getCurrentRecipeLocale())
		} catch (error) {
			throw error
		}
	},
)

/**
 * Get a recipe by public author username and slug.
 * Auth not required; private authors are not exposed.
 */
export const getPublicRecipeByUsernameAndSlug = cache(
	async (username: string, slug: string) => {
		try {
			const author = await db.user.findFirst({
				where: { username, isPrivate: false },
				select: { id: true },
			})
			if (!author) return null

			const recipe = await db.recipe.findFirst({
				where: { authorId: author.id, slug, visibility: 'public' },
				include: recipeSchemaInclude,
			})
			if (!recipe) return null
			return toRecipeSchema(recipe, await getCurrentRecipeLocale())
		} catch (error) {
			throw error
		}
	},
)

/**
 * Get showcase recipes.
 * Auth required.
 */
export const getShowcaseRecipes = cache(
	async (params: {
		cursor?: string
		take?: number
		search?: string
		course?: string
		categories?: string
		sort?: string
	}): Promise<{
		recipes: RecipeSchema[]
		nextCursor: string | null
		totalCount: number
	}> => {
		const empty = { recipes: [], nextCursor: null, totalCount: 0 }
		const currentUser = await auth()
		if (!currentUser) return empty

		const {
			cursor,
			take = PAGE_SIZE,
			search,
			course,
			categories,
			sort,
		} = params
		const safeTake = Math.min(take, 50)
		const recipeSort = normalizeRecipeSort(sort)
		const locale = await getCurrentRecipeLocale()
		const where: Prisma.RecipeWhereInput = {
			visibility: 'showcase',
			...buildRecipeFilterWhere({ search, course, categories }),
		}

		try {
			if (recipeSort === 'timeAsc' || recipeSort === 'timeDesc') {
				const candidates = await db.recipe.findMany({
					where,
					include: recipeSchemaInclude,
					orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
				})
				const sorted = sortRecipesByTime(
					candidates,
					recipeSort === 'timeAsc' ? 'asc' : 'desc',
				)
				const startIndex = cursor
					? Math.max(
							sorted.findIndex((recipe) => recipe.id === cursor) + 1,
							0,
						)
					: 0
				const results = sorted.slice(startIndex, startIndex + safeTake + 1)
				const hasMore = results.length > safeTake
				if (hasMore) results.pop()

				return {
					recipes: results.map((recipe) => toRecipeSchema(recipe, locale)),
					nextCursor: hasMore
						? (results[results.length - 1]?.id ?? null)
						: null,
					totalCount: sorted.length,
				}
			}

			const [results, totalCount] = await Promise.all([
				db.recipe.findMany({
					where,
					include: recipeSchemaInclude,
					orderBy:
						recipeSort === 'createdAtAsc'
							? [{ createdAt: 'asc' }, { id: 'asc' }]
							: [{ createdAt: 'desc' }, { id: 'desc' }],
					take: safeTake + 1,
					...(cursor && { cursor: { id: cursor }, skip: 1 }),
				}),
				db.recipe.count({ where }),
			])

			const hasMore = results.length > safeTake
			if (hasMore) results.pop()

			return {
				recipes: results.map((recipe) => toRecipeSchema(recipe, locale)),
				nextCursor: hasMore
					? (results[results.length - 1]?.id ?? null)
					: null,
				totalCount,
			}
		} catch (error) {
			Sentry.captureException(error, { tags: { query: 'getShowcaseRecipes' } })
			return empty
		}
	},
)

/**
 * Get a showcase recipe by slug.
 * Auth required.
 */
export const getShowcaseRecipeBySlug = cache(async (slug: string) => {
	try {
		const currentUser = await auth()
		if (!currentUser) return null

		const recipe = await db.recipe.findFirst({
			where: { slug, visibility: 'showcase' },
			include: recipeSchemaInclude,
		})
		if (!recipe) return null
		return toRecipeSchema(recipe, await getCurrentRecipeLocale())
	} catch (error) {
		Sentry.captureException(error, {
			tags: { query: 'getShowcaseRecipeBySlug' },
		})
		return null
	}
})

/**
 * Get profile by username.
 * Auth required.
 * @param username Username
 * @returns Promise<{ profile: { id: string, name: string, image: string, ... } | null }>
 */
export const getProfileByUsername = cache(
	async (
		username: string,
	): Promise<{
		profile: {
			id: string
			name: string | null
			image: string | null
			createdAt: Date
			_count: { recipes: number }
		} | null
	}> => {
		const currentUser = await auth()

		/** Not authenticated */
		if (!currentUser) return { profile: null }

		try {
			const profile = await db.user.findFirst({
				where: { username, isPrivate: false },
				select: {
					id: true,
					image: true,
					name: true,
					createdAt: true,
					_count: { select: { recipes: true } },
				},
			})
			if (!profile) return { profile: null }

			const recipeCount = await db.recipe.count({
				where: { authorId: profile.id, visibility: 'public' },
			})

			return { profile: { ...profile, _count: { recipes: recipeCount } } }
		} catch (error) {
			Sentry.captureException(error, {
				tags: { query: 'getProfileByUsername' },
			})
			return { profile: null }
		}
	},
)

/**
 * Get profiles filtered by name.
 * Auth required.
 * @param name Partial or full name
 * @returns Promise<Profile[] | null>
 */
export const getProfilesByName = cache(async (name: string) => {
	const currentUser = await auth()

	/** Not authenticated */
	if (!currentUser) return null
	const userId = currentUser.user?.id

	if (!name.trim()) return []

	try {
		const locale = await getCurrentRecipeLocale()
		const profiles = await db.user.findMany({
			where: {
				id: { not: userId },
				isPrivate: false,
				name: { contains: name, mode: 'insensitive' },
			},
			select: {
				id: true,
				name: true,
				username: true,
				image: true,
				isPrivate: true,
				recipes: {
					where: { visibility: 'public' },
					orderBy: { createdAt: 'desc' },
					take: 1,
					select: {
						defaultLocale: true,
						translations: true,
						slug: true,
						time: true,
						course: true,
						categories: true,
						images: true,
					},
				},
			},
			take: 10,
		})
		const publicRecipeCounts = await Promise.all(
			profiles.map((profile) =>
				db.recipe.count({
					where: { authorId: profile.id, visibility: 'public' },
				}),
			),
		)

		const mappedProfiles = profiles.map((profile, index) => {
			const latestRecipe = profile.recipes?.[0]
			const latestTranslation = latestRecipe
				? resolveRecipeTranslation(latestRecipe, locale)
				: null
			const normalizedLatestRecipe = latestRecipe
				? normalizeRecipeCourseAndCategories(
						latestRecipe.course,
						latestRecipe.categories,
					)
				: null

			return {
				id: profile.id,
				name: profile.name ?? '',
				username: profile.username!,
				image: profile.image ?? '',
				recipesCount: publicRecipeCounts[index] ?? 0,
				latestRecipe: latestRecipe
					? {
							name: latestTranslation!.name,
							slug: latestRecipe.slug,
							time: latestRecipe.time,
							course: normalizedLatestRecipe!.course,
							categories: normalizedLatestRecipe!.categories,
							image: toImageUrls(latestRecipe.images)[0] ?? null,
						}
					: null,
			}
		})

		return { profiles: mappedProfiles }
	} catch (error) {
		Sentry.captureException(error, { tags: { query: 'getProfilesByName' } })
		return null
	}
})
