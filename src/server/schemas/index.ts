import z from 'zod'

export const RecipeCourses = [
	'Starter',
	'FirstCourse',
	'SecondCourse',
	'Dessert',
] as const

export type RecipeCourse = (typeof RecipeCourses)[number]

export const LegacyRecipeCategories = [
	'Pasta',
	'Meat',
	'Fish',
	'Vegetable',
	'Salad',
	'Soup',
] as const

export type LegacyRecipeCategory = (typeof LegacyRecipeCategories)[number]

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

const RecipeCourseSchema = z.enum(RecipeCourses)
const RecipeTagSchema = z.enum(RecipeTags)

export const isRecipeCourse = (value: string): value is RecipeCourse =>
	(RecipeCourses as readonly string[]).includes(value)

export const isRecipeTag = (value: string): value is RecipeTag =>
	(RecipeTags as readonly string[]).includes(value)

const legacyCategoryDefaults: Record<
	LegacyRecipeCategory,
	{ category: RecipeCourse; tags: RecipeTag[] }
> = {
	Pasta: { category: 'FirstCourse', tags: ['Pasta'] },
	Meat: { category: 'SecondCourse', tags: ['Meat'] },
	Fish: { category: 'SecondCourse', tags: ['Fish'] },
	Vegetable: { category: 'FirstCourse', tags: ['Vegetable'] },
	Salad: { category: 'FirstCourse', tags: ['Salad'] },
	Soup: { category: 'FirstCourse', tags: ['Soup'] },
}

const isLegacyRecipeCategory = (value: string): value is LegacyRecipeCategory =>
	(LegacyRecipeCategories as readonly string[]).includes(value)

export function normalizeRecipeCourseAndTags(
	category: string,
	tags?: string[] | null,
): { category: RecipeCourse; tags: RecipeTag[] } {
	const validTags = (tags ?? []).filter(isRecipeTag)
	if (isRecipeCourse(category)) return { category, tags: validTags }

	if (isLegacyRecipeCategory(category)) {
		const fallback = legacyCategoryDefaults[category]
		return {
			category: fallback.category,
			tags: validTags.length ? validTags : fallback.tags,
		}
	}

	return { category: 'FirstCourse', tags: validTags }
}

const RecipeTagsInputSchema = z
	.array(RecipeTagSchema)
	.max(3, { message: 'tags-too-many' })
	.refine((tags) => new Set(tags).size === tags.length, {
		message: 'tags-duplicate',
	})

export const RecipeSchema = z.object({
	id: z.string(),
	slug: z.string(),
	name: z.string(),
	time: z.number().nullable(),
	instructions: z.string(),
	ingredients: z.array(z.string()),
	category: RecipeCourseSchema,
	tags: z.array(RecipeTagSchema),
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
	.max(200)
	.refine((value) => (value.match(/\p{Script=Latin}/gu)?.length ?? 0) >= 2, {
		message: 'ingredient-invalid',
	})

export const CreateRecipeSchema = z.object({
	name: z
		.string()
		.min(3, { message: 'recipe-name-too-short' })
		.max(100, { message: 'recipe-name-too-long' }),
	category: z.enum(RecipeCourses, {
		error: 'category-required',
	}),
	tags: RecipeTagsInputSchema.optional(),
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
				.refine((url) => /^https?:\/\//i.test(url), {
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
