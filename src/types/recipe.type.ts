export const RecipeCourses = [
	'Starter',
	'FirstCourse',
	'SecondCourse',
	'Dessert',
] as const

export type RecipeCourse = (typeof RecipeCourses)[number]

export const RecipeCategories = [
	'Pasta',
	'Meat',
	'Fish',
	'Vegetable',
	'Salad',
	'Soup',
	'Rice',
	'Legume',
	'Seafood',
	'Fruit',
	'Stew',
	'Sauce',
	'Marinade',
	'Wok',
] as const

export type RecipeCategory = (typeof RecipeCategories)[number]

export const RecipeSorts = [
	'createdAtDesc',
	'createdAtAsc',
	'timeAsc',
	'timeDesc',
] as const

export type RecipeSort = (typeof RecipeSorts)[number]

export interface Recipe {
	id: string
	slug: string
	name: string
	time: number | null
	instructions: string
	ingredients: string[]
	createdAt: Date
	updatedAt: Date
	course: RecipeCourse
	categories: RecipeCategory[]
	authorId: string
	authorUsername: string
	images?: string[]
	sourceUrls?: string[]
}
