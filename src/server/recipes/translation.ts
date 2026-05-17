import type { Prisma } from '@prisma/client'

import {
	normalizeRecipeComplements,
	normalizeRecipeCourseAndCategories,
	type RecipeLocale,
	type RecipeSchema,
	type RecipeVisibility,
} from '@/server/schemas'
import {
	DEFAULT_RECIPE_LOCALE,
	normalizeRecipeLocale,
} from '@/server/recipes/locale'

export const recipeSchemaInclude = {
	translations: true,
	author: { select: { username: true } },
} satisfies Prisma.RecipeInclude

export type RecipeWithTranslationsAndAuthor = Prisma.RecipeGetPayload<{
	include: typeof recipeSchemaInclude
}>

export type RecipeTranslationLike = {
	locale: string
	name: string
	ingredients: string[]
	instructions: string
	complements?: unknown
}

type RecipeLike = {
	id: string
	slug: string
	defaultLocale?: string | null
	visibility?: string | null
	time: number | null
	images: string[]
	sourceUrls: string[]
	createdAt: Date
	updatedAt: Date
	course: string
	categories?: string[] | null
	authorId: string | null
	author?: { username: string | null } | null
	translations?: RecipeTranslationLike[] | null
	name?: string
	ingredients?: string[]
	instructions?: string
	complements?: unknown
}

type RecipeTranslationSource = {
	defaultLocale?: string | null
	translations?: RecipeTranslationLike[] | null
	name?: string
	slug?: string
	ingredients?: string[]
	instructions?: string
	complements?: unknown
}

function uniqueLocales(values: RecipeLocale[]): RecipeLocale[] {
	return Array.from(new Set(values))
}

export function resolveRecipeTranslation(
	recipe: RecipeTranslationSource,
	requestedLocale?: string | null,
): RecipeTranslationLike {
	const translations = recipe.translations ?? []
	const localeOrder = uniqueLocales([
		normalizeRecipeLocale(requestedLocale),
		normalizeRecipeLocale(recipe.defaultLocale),
		DEFAULT_RECIPE_LOCALE,
	])

	for (const locale of localeOrder) {
		const translation = translations.find((entry) => entry.locale === locale)
		if (translation) return translation
	}

	const firstTranslation = translations[0]
	if (firstTranslation) return firstTranslation

	return {
		locale: normalizeRecipeLocale(recipe.defaultLocale),
		name: recipe.name ?? recipe.slug ?? '',
		ingredients: recipe.ingredients ?? [],
		instructions: recipe.instructions ?? '',
		complements: recipe.complements ?? [],
	}
}

export function mapRecipeToSchema(
	recipe: RecipeLike,
	requestedLocale?: string | null,
	images = recipe.images,
): RecipeSchema {
	const translation = resolveRecipeTranslation(recipe, requestedLocale)

	return {
		id: recipe.id,
		slug: recipe.slug,
		name: translation.name,
		time: recipe.time,
		instructions: translation.instructions,
		ingredients: translation.ingredients,
		complements: normalizeRecipeComplements(translation.complements),
		...normalizeRecipeCourseAndCategories(recipe.course, recipe.categories),
		authorId: recipe.authorId,
		authorUsername: recipe.author?.username ?? '',
		createdAt: recipe.createdAt,
		updatedAt: recipe.updatedAt,
		images,
		sourceUrls: recipe.sourceUrls,
		visibility: (recipe.visibility ?? 'public') as RecipeVisibility,
		locale: normalizeRecipeLocale(translation.locale),
	}
}
