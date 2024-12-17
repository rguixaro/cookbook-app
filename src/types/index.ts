import z from 'zod';

export type CategoryType = (typeof categories)[number];
export const categories = [
	'pasta',
	'meat',
	'fish',
	'vegetable',
	'salad',
	'soup',
	'desert',
] as const;

export const IngredientSchema = z.object({
	id: z.number(),
	name: z.string(),
	quantity: z.number(),
	unit: z.string(),
});

export const RecipeSchema = z.object({
	id: z.number(),
	slug: z.string(),
	name: z.string(),
	time: z.number().optional(),
	rations: z.number().optional(),
	ingredients: z.array(IngredientSchema),
	instructions: z.string(),
	category: z.enum(categories),
});

export const CreateRecipeSchema = z.object({
	name: z.string().min(3),
	time: z.number().optional(),
	rations: z.number().default(2),
	ingredients: z.array(IngredientSchema).nonempty(),
	instructions: z.string().min(10),
});

export type IngredientSchema = z.TypeOf<typeof IngredientSchema>;
export type RecipeSchema = z.TypeOf<typeof RecipeSchema>;
export type CreateRecipeInput = z.TypeOf<typeof CreateRecipeSchema>;
