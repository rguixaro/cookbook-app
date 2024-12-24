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
			/* @ts-expect-error: Unnecessary typing */
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

/**
 * Get profile and recipes by user id.
 * Auth required.
 * @param userId User id
 * @returns Promise<{ profile: { name: string, image: string } | null; recipes: Recipe[] }>
 */
export const getProfileAndRecipes = cache(
	async (
		userId: string
	): Promise<{
		profile: { name: string; image: string } | null;
		recipes: Recipe[];
	}> => {
		const currentUser = await auth();

		/** Not authenticated */
		if (!currentUser) return { profile: null, recipes: [] };

		try {
			const profile = await db.user.findFirst({
				where: { id: userId },
				select: { image: true, name: true },
			});
			const recipes = await db.recipe.findMany({
				where: { authorId: userId },
			});
			/* @ts-expect-error: Unnecessary typing */
			return { profile, recipes };
		} catch (error) {
			return { profile: null, recipes: [] };
		}
	}
);
