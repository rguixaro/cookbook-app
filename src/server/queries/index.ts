import { cache } from 'react';

import { auth } from '@/auth';
import { db } from '@/server/db';
import { Recipe } from '@/types';
import { RecipeSchema } from '../schemas';

/**
 * Get recipes by user.
 * Auth required.
 * @returns Promise<{ recipes: Recipe[] } | null>
 */
export const getRecipesByUser = cache(async () => {
	const currentUser = await auth();

	/** Not authenticated */
	if (!currentUser) return null;

	try {
		let savedRecipes: RecipeSchema[] = [];
		const ownRecipes = await db.recipe.findMany({
			where: { authorId: currentUser.user?.id },
		});
		if (currentUser.user.savedRecipes.length)
			savedRecipes = await db.recipe.findMany({
				where: { id: { in: currentUser.user.savedRecipes } },
			});

		return { recipes: [...ownRecipes, ...savedRecipes] };
	} catch (error) {
		throw error;
	}
});

/**
 * Get recipe by author and slug.
 * Auth required.
 * @param authorId Recipe author id
 * @param slug Recipe slug
 * @returns Promise<Recipe | null>
 */
export const getRecipeByAuthAndSlug = cache(
	async (authorId: string, slug: string) => {
		const currentUser = await auth();

		/** Not authenticated */
		if (!currentUser) return null;

		try {
			const recipe = await db.recipe.findFirst({ where: { authorId, slug } });
			return recipe;
		} catch (error) {
			throw error;
		}
	}
);
