import { cache } from 'react'
import * as Sentry from '@sentry/nextjs'

import { auth } from '@/auth'
import { db } from '@/server/db'
import {
	RecipeSchema,
	normalizeRecipeComplements,
	normalizeRecipeCourseAndCategories,
} from '../schemas'

const CLOUDFRONT_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN

/** Convert S3 file keys to full CloudFront URLs */
export function toImageUrls(keys: string[]): string[] {
	if (!CLOUDFRONT_DOMAIN) return []
	return keys.map((key) => `${CLOUDFRONT_DOMAIN}/${key}`)
}

/**
 * Convert a recipe from the database to the RecipeSchema used in the app.
 * @param recipe
 * @returns RecipeSchema
 */
function toRecipeSchema(
	recipe: Awaited<ReturnType<typeof db.recipe.findMany>>[number] & {
		author?: { username: string | null } | null
	},
): RecipeSchema {
	return {
		...recipe,
		...normalizeRecipeCourseAndCategories(recipe.course, recipe.categories),
		complements: normalizeRecipeComplements(
			'complements' in recipe ? recipe.complements : undefined,
		),
		authorUsername: recipe.author?.username ?? '',
		images: toImageUrls(recipe.images),
	}
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
		let savedRecipes: RecipeSchema[] = []
		const rawRecipes = await db.recipe.findMany({
			where: { authorId },
			include: { author: { select: { username: true } } },
		})
		const recipes = rawRecipes.map(toRecipeSchema)

		if (!userId) {
			const savedIds = await getSavedRecipeIds()
			if (savedIds.length) {
				const rawSaved = await db.recipe.findMany({
					where: { id: { in: savedIds } },
					include: { author: { select: { username: true } } },
				})
				savedRecipes = rawSaved.map(toRecipeSchema)
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
				where: { authorId, slug },
				include: { author: { select: { username: true } } },
			})
			if (!recipe) return null
			return toRecipeSchema(recipe)
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
				where: { authorId: author.id, slug },
				include: { author: { select: { username: true } } },
			})
			if (!recipe) return null
			return toRecipeSchema(recipe)
		} catch (error) {
			throw error
		}
	},
)

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
			return { profile }
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
				_count: { select: { recipes: true } },
			},
			take: 10,
		})

		const mappedProfiles = profiles.map((profile) => ({
			id: profile.id,
			name: profile.name ?? '',
			username: profile.username!,
			image: profile.image ?? '',
			recipesCount: profile._count.recipes,
		}))

		return { profiles: mappedProfiles }
	} catch (error) {
		Sentry.captureException(error, { tags: { query: 'getProfilesByName' } })
		return null
	}
})
