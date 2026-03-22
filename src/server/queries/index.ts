import { cache } from 'react'

import { auth } from '@/auth'
import { db } from '@/server/db'
import { RecipeSchema } from '../schemas'

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
	} catch {
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
	} catch {
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
	} catch {
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

	try {
		let savedRecipes: RecipeSchema[] = []
		const rawRecipes = await db.recipe.findMany({
			where: { authorId },
			include: { author: { select: { username: true } } },
		})
		const recipes = rawRecipes.map((r) => ({
			...r,
			authorUsername: r.author?.username ?? '',
			author: undefined,
		}))

		if (!userId) {
			const savedIds = await getSavedRecipeIds()
			if (savedIds.length) {
				const rawSaved = await db.recipe.findMany({
					where: { id: { in: savedIds } },
					include: { author: { select: { username: true } } },
				})
				savedRecipes = rawSaved.map((r) => ({
					...r,
					authorUsername: r.author?.username ?? '',
					author: undefined,
				}))
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

		try {
			const recipe = await db.recipe.findFirst({
				where: { authorId, slug },
				include: { author: { select: { username: true } } },
			})
			if (!recipe) return null
			return {
				...recipe,
				authorUsername: recipe.author?.username ?? '',
				author: undefined,
			}
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
			name: string
			image: string
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
		} catch {
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

	/** Empty name */
	if (!name.trim()) return []

	try {
		const profiles = await db.user.findMany({
			where: {
				id: { not: userId },
				isPrivate: false,
				name: {
					contains: name,
					mode: 'insensitive',
				},
			},
			select: {
				id: true,
				name: true,
				username: true,
				image: true,
				isPrivate: true,
				_count: {
					select: {
						recipes: true,
					},
				},
				savedRecipes: true,
			},
			take: 10,
		})

		const mappedProfiles = profiles.map((profile) => ({
			id: profile.id,
			name: profile.name,
			username: profile.username,
			image: profile.image,
			recipesCount: profile._count.recipes + profile.savedRecipes.length,
		}))

		return { profiles: mappedProfiles }
	} catch {
		return null
	}
})
