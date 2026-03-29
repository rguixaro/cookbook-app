import z from 'zod'

export const Categories = [
	'Starter',
	'Pasta',
	'Meat',
	'Fish',
	'Vegetable',
	'Salad',
	'Soup',
	'Dessert',
] as const

export type Categories = (typeof Categories)[number]

export const RecipeSchema = z.object({
	id: z.string(),
	slug: z.string(),
	name: z.string(),
	time: z.number().nullable(),
	instructions: z.string(),
	ingredients: z.array(z.string()),
	category: z.enum(Categories),
	authorId: z.string(),
	authorUsername: z.string(),
	createdAt: z.date(),
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

export const CreateRecipeSchema = z.object({
	name: z
		.string()
		.min(3, { message: 'recipe-name-too-short' })
		.max(100, { message: 'recipe-name-too-long' }),
	category: z.enum(Categories, {
		error: 'category-required',
	}),
	time: z
		.number({ error: 'time-invalid' })
		.min(1, { message: 'time-invalid' })
		.max(10080, { message: 'time-invalid' }),
	ingredients: z
		.array(z.string().min(1).max(200))
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
