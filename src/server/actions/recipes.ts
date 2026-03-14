'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { auth } from '@/auth'
import { db } from '@/server/db'
import { CreateRecipeSchema } from '@/server/schemas'
import { formatLongSentence, slugify } from '@/server/utils'

interface createRecipeResult {
	error: boolean
	message?: string
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

	const { name, category, time, ingredients, instructions } = parsed.data

	const slug = slugify(name)
	if (!slug) return { error: true, message: 'error-recipe-name-invalid' }

	try {
		await db.recipe.create({
			data: {
				name,
				category,
				time,
				ingredients,
				instructions: formatLongSentence(instructions),
				authorId: currentUser.user.id,
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

	const { name, category, time, ingredients, instructions } = parsed.data

	const slug = slugify(name)
	if (!slug) return { error: true, message: 'error-recipe-name-invalid' }

	try {
		const recipe = await db.recipe.findFirst({
			where: { id, authorId: currentUser.user.id },
		})

		if (!recipe) return { error: true, message: 'error' }

		await db.recipe.update({
			where: { id },
			data: {
				name,
				category,
				time,
				ingredients,
				instructions: formatLongSentence(instructions),
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
			/** Unsave: remove from savedRecipes */
			const user = await db.user.findUnique({
				where: { id: userId },
				select: { savedRecipes: true },
			})
			if (!user) return { error: true }

			await db.user.update({
				where: { id: userId },
				data: {
					savedRecipes: {
						set: user.savedRecipes.filter((r) => r !== id),
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
		await db.recipe.delete({
			where: { id, authorId: currentUser.user.id },
		})

		revalidatePath('/recipes')

		return { error: false }
	} catch {
		return { error: true }
	}
}
