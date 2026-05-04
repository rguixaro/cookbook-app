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

export const RecipeComplementTypes = ['Sauce', 'Marinade', 'Garnish'] as const

export type RecipeComplementType = (typeof RecipeComplementTypes)[number]

const RecipeCourseSchema = z.enum(RecipeCourses)
const RecipeCategorySchema = z.enum(RecipeCategories)
const RecipeComplementTypeSchema = z.enum(RecipeComplementTypes)
const RecipeComplementValueSchema = z.object({
	type: RecipeComplementTypeSchema,
	ingredients: z.array(z.string()),
	instructions: z.string(),
})
export const INGREDIENT_MAX_LENGTH = 35

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

export function normalizeRecipeComplements(
	complements?: unknown,
): RecipeComplementSchema[] {
	const result = z.array(RecipeComplementValueSchema).safeParse(complements ?? [])
	return result.success ? result.data : []
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
	complements: z.array(RecipeComplementValueSchema),
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

const hasMeaningfulIngredientText = (value: string) =>
	(value.match(/\p{Script=Latin}/gu)?.length ?? 0) >= 2

const createIngredientSchema = (
	allowedOverlongIngredients: readonly string[] = [],
) => {
	const allowedOverlongValues = new Set(
		allowedOverlongIngredients.map((ingredient) => ingredient.trim()),
	)

	return z
		.string()
		.trim()
		.min(2, { message: 'ingredient-invalid' })
		.refine(
			(value) =>
				value.length <= INGREDIENT_MAX_LENGTH ||
				allowedOverlongValues.has(value),
			{ message: 'ingredient-too-long' },
		)
		.refine(hasMeaningfulIngredientText, {
			message: 'ingredient-invalid',
		})
}

const createIngredientsArraySchema = (
	allowedOverlongIngredients: readonly string[] = [],
) =>
	z
		.array(createIngredientSchema(allowedOverlongIngredients))
		.superRefine((ingredients, ctx) => {
			const remainingAllowed = new Map<string, number>()
			for (const ingredient of allowedOverlongIngredients) {
				const value = ingredient.trim()
				if (value.length <= INGREDIENT_MAX_LENGTH) continue
				remainingAllowed.set(value, (remainingAllowed.get(value) ?? 0) + 1)
			}

			ingredients.forEach((ingredient, index) => {
				if (ingredient.length <= INGREDIENT_MAX_LENGTH) return

				const remaining = remainingAllowed.get(ingredient) ?? 0
				if (remaining > 0) {
					remainingAllowed.set(ingredient, remaining - 1)
					return
				}

				ctx.addIssue({
					code: 'custom',
					message: 'ingredient-too-long',
					path: [index],
				})
			})
		})
		.nonempty({ message: 'ingredients-required' })

const IngredientSchema = createIngredientSchema()

const createComplementSchema = (
	allowedOverlongIngredients: readonly string[] = [],
) =>
	z.object({
		type: RecipeComplementTypeSchema,
		ingredients: createIngredientsArraySchema(allowedOverlongIngredients),
		instructions: z
			.string()
			.trim()
			.max(10000, { message: 'instructions-too-long' }),
	})

const createComplementsSchema = (
	allowedOverlongIngredients: readonly string[] = [],
) =>
	z
		.array(createComplementSchema(allowedOverlongIngredients))
		.default([])
		.refine(
			(complements) =>
				new Set(complements.map((complement) => complement.type)).size ===
				complements.length,
			{ message: 'complements-duplicate' },
		)

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
	complements: createComplementsSchema(),
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

export const createEditRecipeSchema = (
	existingIngredients: readonly string[] = [],
) =>
	CreateRecipeSchema.extend({
		ingredients: createIngredientsArraySchema(existingIngredients),
		complements: createComplementsSchema(existingIngredients),
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
export type RecipeComplementSchema = RecipeSchema['complements'][number]
