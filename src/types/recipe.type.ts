export const RecipeCourses = [
	'Starter',
	'FirstCourse',
	'SecondCourse',
	'Dessert',
] as const

export type RecipeCourse = (typeof RecipeCourses)[number]

export const RecipeTags = [
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

export type RecipeTag = (typeof RecipeTags)[number]

export const Categories = RecipeCourses
export type Categories = RecipeCourse

export interface Recipe {
	id: string
	slug: string
	name: string
	time: number | null
	instructions: string
	ingredients: string[]
	createdAt: Date
	updatedAt: Date
	category: RecipeCourse
	tags: RecipeTag[]
	authorId: string
	authorUsername: string
	images?: string[]
	sourceUrls?: string[]
}
