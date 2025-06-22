'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import type { z } from 'zod';

import { auth } from '@/auth';
import { db } from '@/server/db';
import type { CreateRecipeSchema } from '@/server/schemas';
import { Recipe } from '@/types';
import { formatLongSentence } from '../utils';

/**
 * Get single recipe data.
 * Auth required.
 * @param id {string}
 * @returns Promise<Recipe | null>
 */
export const getSingleRecipe = async (id: string): Promise<Recipe | null> => {
	const currentUser = await auth();

	/** Not authenticated */
	if (!currentUser) return null;

	return await db.recipe.findUnique({ where: { id } });
};

interface createRecipeResult {
	error: boolean;
	message?: string;
}

/**
 * Create new recipe.
 * Auth required.
 * @param values {z.infer<typeof CreateRecipeSchema>}
 * @returns Promise<createRecipeResult>
 */
export const createRecipe = async (
	values: z.infer<typeof CreateRecipeSchema>
): Promise<createRecipeResult> => {
	const currentUser = await auth();

	/** Not authenticated */
	if (!currentUser)
		return { error: true, message: 'Not authenticated. Please login again.' };

	try {
		await db.recipe.create({
			data: {
				...values,
				authorId: currentUser.user?.id,
				slug: values.name.trim().replace(' ', '-').toLowerCase(),
				instructions: formatLongSentence(values.instructions),
			},
		});
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			if (e.code === 'P2002') {
				return { error: true, message: 'error-recipe-exists' };
			}
		}
		return { error: true, message: 'error' };
	}

	revalidatePath('/');
	revalidatePath('/recipes');

	return { error: false };
};

/**
 * Update an existing recipe.
 * Auth required.
 * @param values {z.infer<typeof CreateRecipeSchema>}
 * @returns Promise<createRecipeResult>
 */
export const updateRecipe = async (
	id: string,
	userId: string,
	values: z.infer<typeof CreateRecipeSchema>
): Promise<createRecipeResult> => {
	const currentUser = await auth();

	/** Not authenticated */
	if (!currentUser)
		return { error: true, message: 'Not authenticated. Please login again.' };

	try {
		// The recipe belongs to the user
		const recipe = await db.recipe.findFirst({
			where: { id, authorId: userId },
		});

		if (!recipe) return { error: true, message: 'Recipe not found.' };

		await db.recipe.update({
			where: { id },
			data: {
				...values,
				slug: values.name.trim().toLowerCase().replace(/\s+/g, '-'),
				instructions: formatLongSentence(values.instructions),
			},
		});
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			if (e.code === 'P2002') {
				return { error: true, message: 'error-recipe-exists' };
			}
		}
		return { error: true, message: 'error' };
	}

	revalidatePath('/');
	revalidatePath('/recipes');

	return { error: false };
};

/**
 * Save or unsave recipe.
 * Auth required.
 * @param id {string}
 * @param isSaved {boolean} - true if recipe is saved, false if unsaved
 * @returns Promise<{ error: boolean; message?: string }>
 */
export const saveRecipe = async (
	id: string,
	isSaved: boolean
): Promise<{ error: boolean }> => {
	const currentUser = await auth();

	/** Not authenticated */
	if (!currentUser) return { error: true };
	if (isSaved)
		await db.user.update({
			where: { id: currentUser.user?.id },
			data: {
				savedRecipes: {
					set: currentUser.user?.savedRecipes.filter((r) => r !== id),
				},
			},
		});
	else
		await db.user.update({
			where: { id: currentUser.user?.id },
			data: { savedRecipes: { push: id } },
		});

	return { error: false };
};

/**
 * Delete recipe.
 * Auth required.
 * @param id {string}
 * @returns Promise<{ error: boolean }>
 */
export const deleteRecipe = async (id: string): Promise<{ error: boolean }> => {
	const currentUser = await auth();

	/** Not authenticated */
	if (!currentUser) return { error: true };

	await db.recipe.delete({ where: { id: id, authorId: currentUser.user?.id } });

	revalidatePath('/recipes');

	return { error: false };
};
