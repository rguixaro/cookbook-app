export const RecipeCourses = [
	'starter',
	'first_course',
	'second_course',
	'dessert',
] as const

export type RecipeCourse = (typeof RecipeCourses)[number]

export const RecipeCategories = [
	'pasta',
	'meat',
	'fish',
	'vegetable',
	'salad',
	'soup',
	'rice',
	'legume',
	'seafood',
	'fruit',
	'stew',
	'sauce',
	'marinade',
	'wok',
] as const

export type RecipeCategory = (typeof RecipeCategories)[number]

export const RecipeSorts = [
	'createdAtDesc',
	'createdAtAsc',
	'timeAsc',
	'timeDesc',
] as const

export type RecipeSort = (typeof RecipeSorts)[number]

export const RecipeComplementTypes = ['sauce', 'marinade', 'garnish'] as const

export type RecipeComplementType = (typeof RecipeComplementTypes)[number]

export const RecipeLocales = ['ca', 'en', 'es'] as const

export type RecipeLocale = (typeof RecipeLocales)[number]

export const RecipeVisibilityValues = [
	'private',
	'public',
	'showcase',
] as const

export type RecipeVisibility = (typeof RecipeVisibilityValues)[number]

export interface RecipeComplement {
	type: RecipeComplementType
	name?: string
	ingredients: string[]
	instructions: string
}

export interface Recipe {
	id: string
	slug: string
	name: string
	time: number | null
	instructions: string
	ingredients: string[]
	complements: RecipeComplement[]
	createdAt: Date
	updatedAt: Date
	course: RecipeCourse
	categories: RecipeCategory[]
	authorId: string | null
	authorUsername: string
	images?: string[]
	sourceUrls?: string[]
	visibility: RecipeVisibility
	locale: RecipeLocale
}
