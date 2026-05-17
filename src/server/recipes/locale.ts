import { getLocale } from 'next-intl/server'

import { RecipeLocales, type RecipeLocale } from '@/server/schemas'

export const DEFAULT_RECIPE_LOCALE: RecipeLocale = 'en'
export type { RecipeLocale }

export function isRecipeLocale(value?: string | null): value is RecipeLocale {
	return RecipeLocales.includes(value as RecipeLocale)
}

export function normalizeRecipeLocale(value?: string | null): RecipeLocale {
	return isRecipeLocale(value) ? value : DEFAULT_RECIPE_LOCALE
}

export async function getCurrentRecipeLocale(): Promise<RecipeLocale> {
	try {
		return normalizeRecipeLocale(await getLocale())
	} catch {
		return DEFAULT_RECIPE_LOCALE
	}
}
