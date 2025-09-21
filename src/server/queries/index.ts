import { cache } from 'react'

import { auth } from '@/auth'
import { db } from '@/server/db'
import { Recipe } from '@/types'
import { RecipeSchema } from '../schemas'

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
		const recipes = await db.recipe.findMany({ where: { authorId } })
		if (!userId && currentUser.user.savedRecipes.length)
			savedRecipes = await db.recipe.findMany({
				where: { id: { in: currentUser.user.savedRecipes } },
			})

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
			const recipe = await db.recipe.findFirst({ where: { authorId, slug } })
			return recipe
		} catch (error) {
			throw error
		}
	}
)

/**
 * Get profile by user id.
 * Auth required.
 * @param userId User id
 * @returns Promise<{ profile: { name: string, image: string } | null; }>
 */
export const getProfileByUserId = cache(
	async (
		userId: string
	): Promise<{
		profile: { name: string; image: string } | null
	}> => {
		const currentUser = await auth()

		/** Not authenticated */
		if (!currentUser) return { profile: null }

		try {
			const profile = await db.user.findFirst({
				where: { id: userId },
				select: { image: true, name: true },
			})
			return { profile }
		} catch (error) {
			return { profile: null }
		}
	}
)

/**
 * Get authors filtered by name.
 * Auth required.
 * @param name Partial or full author name
 * @returns Promise<User[] | null>
 */
export const getAuthorsByName = cache(async (name: string) => {
	const currentUser = await auth()

	/** Not authenticated */
	if (!currentUser) return null
	const userId = currentUser.user?.id

	/** Empty name */
	if (!name.trim()) return []

	try {
		const authors = await db.user.findMany({
			where: {
				id: { not: userId },
				name: {
					contains: name,
					mode: 'insensitive',
				},
			},
			select: {
				id: true,
				name: true,
				_count: {
					select: {
						recipes: true,
					},
				},
				savedRecipes: true,
			},
			take: 10,
		})

		const mappedAuthors = authors.map((author) => ({
			id: author.id,
			name: author.name,
			recipesCount: author._count.recipes + author.savedRecipes.length,
		}))

		return { authors: mappedAuthors }
	} catch (error) {
		return null
	}
})
