import z from 'zod'

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

const RecipeCourseSchema = z.enum(RecipeCourses)
const RecipeCategorySchema = z.enum(RecipeCategories)

export const isRecipeCourse = (value: string): value is RecipeCourse =>
	(RecipeCourses as readonly string[]).includes(value)

export const isRecipeCategory = (value: string): value is RecipeCategory =>
	(RecipeCategories as readonly string[]).includes(value)

export const isRecipeSort = (value: string): value is RecipeSort =>
	(RecipeSorts as readonly string[]).includes(value)

export const normalizeRecipeSort = (value?: string | null): RecipeSort => {
	if (value === 'createdAtAsc') return 'createdAtAsc'
	if (value === 'timeAsc') return 'timeAsc'
	if (value === 'timeDesc') return 'timeDesc'
	return 'createdAtDesc'
}

export function normalizeRecipeCourseAndCategories(
	course: string,
	categories?: string[] | null,
): { course: RecipeCourse; categories: RecipeCategory[] } {
	const validCategories = (categories ?? []).filter(isRecipeCategory)

	return {
		course: isRecipeCourse(course) ? course : 'FirstCourse',
		categories: validCategories,
	}
}

const RecipeCategoriesInputSchema = z
	.array(RecipeCategorySchema)
	.max(3, { message: 'categories-too-many' })
	.refine((categories) => new Set(categories).size === categories.length, {
		message: 'categories-duplicate',
	})
	.default([])

export const RecipeSchema = z.object({
	id: z.string(),
	slug: z.string(),
	name: z.string(),
	time: z.number().nullable(),
	instructions: z.string(),
	ingredients: z.array(z.string()),
	course: RecipeCourseSchema,
	categories: z.array(RecipeCategorySchema),
	authorId: z.string(),
	authorUsername: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
	images: z.array(z.string()).optional(),
	sourceUrls: z.array(z.string().url()).optional(),
})

export const ProfileSchema = z.object({
	id: z.string(),
	name: z.string(),
	username: z.string(),
	image: z.string(),
	recipesCount: z.number(),
})

const IngredientSchema = z
	.string()
	.trim()
	.min(2, { message: 'ingredient-invalid' })
	.max(30, { message: 'ingredient-too-long' })
	.refine((value) => (value.match(/\p{Script=Latin}/gu)?.length ?? 0) >= 2, {
		message: 'ingredient-invalid',
	})

export const CreateRecipeSchema = z.object({
	name: z
		.string()
		.min(3, { message: 'recipe-name-too-short' })
		.max(100, { message: 'recipe-name-too-long' }),
	course: z.enum(RecipeCourses, {
		error: 'course-required',
	}),
	categories: RecipeCategoriesInputSchema,
	time: z
		.number({ error: 'time-invalid' })
		.min(1, { message: 'time-invalid' })
		.max(10080, { message: 'time-invalid' }),
	ingredients: z
		.array(IngredientSchema)
		.nonempty({ message: 'ingredients-required' }),
	instructions: z
		.string()
		.min(10, { message: 'instructions-too-short' })
		.max(10000, { message: 'instructions-too-long' }),
	sourceUrls: z
		.array(
			z
				.string()
				.max(2048)
				.url({ message: 'source-url-invalid' })
				.refine((url) => /^https:\/\//i.test(url), {
					message: 'source-url-invalid',
				}),
		)
		.max(2),
})

export const UpdateProfileSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, { message: 'username-required' })
		.max(40, { message: 'username-too-long' }),
	isPrivate: z.boolean().optional(),
})

export type UpdateProfileInput = z.TypeOf<typeof UpdateProfileSchema>

export type RecipeSchema = z.TypeOf<typeof RecipeSchema>
export type ProfileSchema = z.TypeOf<typeof ProfileSchema>
export type CreateRecipeInput = z.TypeOf<typeof CreateRecipeSchema>
