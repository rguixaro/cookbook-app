import { describe, it, expect } from 'vitest'
import {
	CreateRecipeSchema,
	RecipeCategories,
	UpdateProfileSchema,
	createEditRecipeSchema,
	normalizeRecipeComplements,
	normalizeRecipeCourseAndCategories,
} from './index'

const validRecipe = {
	name: 'Paella Valenciana',
	course: 'SecondCourse' as const,
	categories: ['Fish'] as const,
	time: 60,
	ingredients: ['rice', 'shrimp', 'saffron'],
	instructions: 'Cook the rice with the shrimp and saffron in a large pan.',
	sourceUrls: [],
}

describe('CreateRecipeSchema', () => {
	it('accepts valid input', () => {
		const result = CreateRecipeSchema.safeParse(validRecipe)
		expect(result.success).toBe(true)
	})

	it('defaults missing complements to an empty array', () => {
		const result = CreateRecipeSchema.safeParse(validRecipe)

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.complements).toEqual([])
		}
	})

	it('accepts valid complements', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			complements: [
				{
					type: 'Sauce',
					ingredients: ['tomato', 'olive oil'],
					instructions: 'Simmer the tomato and oil until glossy.',
				},
				{
					type: 'Garnish',
					ingredients: ['parsley'],
					instructions: 'Chop the parsley and scatter before serving.',
				},
			],
		})

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.ingredients).toEqual(validRecipe.ingredients)
			expect(result.data.instructions).toBe(validRecipe.instructions)
			expect(result.data.complements).toHaveLength(2)
		}
	})

	it('rejects complement without ingredients', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			complements: [
				{
					type: 'Sauce',
					ingredients: [],
					instructions: 'Simmer the sauce until it thickens.',
				},
			],
		})

		expect(result.success).toBe(false)
	})

	it('accepts complements without instructions', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			complements: [
				{
					type: 'Sauce',
					ingredients: ['tomato'],
					instructions: '',
				},
			],
		})

		expect(result.success).toBe(true)
	})

	it('rejects invalid complement types', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			complements: [
				{
					type: 'Butter',
					ingredients: ['butter'],
					instructions: 'Melt the butter before serving.',
				},
			],
		})

		expect(result.success).toBe(false)
	})

	it('rejects duplicate complement types', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			complements: [
				{
					type: 'Sauce',
					ingredients: ['tomato'],
					instructions: 'Simmer the tomato until it thickens.',
				},
				{
					type: 'Sauce',
					ingredients: ['parsley'],
					instructions: 'Chop the parsley and mix it through.',
				},
			],
		})

		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe('complements-duplicate')
		}
	})

	it('rejects name shorter than 3 chars', () => {
		const result = CreateRecipeSchema.safeParse({ ...validRecipe, name: 'ab' })
		expect(result.success).toBe(false)
	})

	it('rejects name longer than 100 chars', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			name: 'a'.repeat(101),
		})
		expect(result.success).toBe(false)
	})

	it('rejects invalid course', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			course: 'Pizza',
		})
		expect(result.success).toBe(false)
	})

	it('accepts all valid courses', () => {
		const courses = ['Starter', 'FirstCourse', 'SecondCourse', 'Dessert']
		for (const course of courses) {
			const result = CreateRecipeSchema.safeParse({ ...validRecipe, course })
			expect(result.success).toBe(true)
		}
	})

	it('accepts all valid categories', () => {
		for (const category of RecipeCategories) {
			const result = CreateRecipeSchema.safeParse({
				...validRecipe,
				categories: [category],
			})
			expect(result.success).toBe(true)
		}
	})

	it('rejects invalid categories', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			categories: ['Pizza'],
		})
		expect(result.success).toBe(false)
	})

	it('accepts empty categories array', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			categories: [],
		})

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.categories).toEqual([])
		}
	})

	it('defaults missing categories to an empty array', () => {
		const { categories: _categories, ...recipeWithoutCategories } = validRecipe
		const result = CreateRecipeSchema.safeParse(recipeWithoutCategories)

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.categories).toEqual([])
		}
	})

	it('rejects duplicate categories', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			categories: ['Fish', 'Fish'],
		})
		expect(result.success).toBe(false)
	})

	it('rejects more than 3 categories', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			categories: ['Fish', 'Seafood', 'Rice', 'Wok'],
		})
		expect(result.success).toBe(false)
	})

	it('normalizes recipe course and filters categories during reads', () => {
		expect(normalizeRecipeCourseAndCategories('FirstCourse', ['Pasta'])).toEqual(
			{
				course: 'FirstCourse',
				categories: ['Pasta'],
			},
		)
		expect(
			normalizeRecipeCourseAndCategories('Pizza', ['Fish', 'Pizza']),
		).toEqual({
			course: 'FirstCourse',
			categories: ['Fish'],
		})
	})

	it('normalizes missing recipe complements during reads', () => {
		expect(normalizeRecipeComplements(undefined)).toEqual([])
	})

	it('rejects time less than 1', () => {
		const result = CreateRecipeSchema.safeParse({ ...validRecipe, time: 0 })
		expect(result.success).toBe(false)
	})

	it('rejects time greater than 10080', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			time: 10081,
		})
		expect(result.success).toBe(false)
	})

	it('rejects empty ingredients array', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			ingredients: [],
		})
		expect(result.success).toBe(false)
	})

	it('rejects ingredients without at least two letters', () => {
		const invalidIngredients = ['a', '1', ',.-º12?¿¿']

		for (const ingredient of invalidIngredients) {
			const result = CreateRecipeSchema.safeParse({
				...validRecipe,
				ingredients: [ingredient],
			})
			expect(result.success).toBe(false)
		}
	})

	it('rejects ingredients longer than 35 characters', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			ingredients: ['123456789012345678901234567890103124'],
		})

		expect(result.success).toBe(false)
	})

	it('accepts unchanged legacy edit ingredients longer than 35 characters', () => {
		const legacyIngredient = 'very long preserved lemon ingredient name'
		const result = createEditRecipeSchema([legacyIngredient]).safeParse({
			...validRecipe,
			ingredients: [legacyIngredient],
		})

		expect(result.success).toBe(true)
	})

	it('rejects new edit ingredients longer than 35 characters', () => {
		const legacyIngredient = 'very long preserved lemon ingredient name'
		const result = createEditRecipeSchema([legacyIngredient]).safeParse({
			...validRecipe,
			ingredients: [`${legacyIngredient} changed`],
		})

		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe('ingredient-too-long')
		}
	})

	it('rejects extra copies of unchanged legacy overlong ingredients', () => {
		const legacyIngredient = 'very long preserved lemon ingredient name'
		const result = createEditRecipeSchema([legacyIngredient]).safeParse({
			...validRecipe,
			ingredients: [legacyIngredient, legacyIngredient],
		})

		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe('ingredient-too-long')
		}
	})

	it('accepts ingredients with quantities and text', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			ingredients: ['2 eggs', '1 cullerada d’oli'],
		})

		expect(result.success).toBe(true)
	})

	it('rejects instructions shorter than 10 chars', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			instructions: 'Too short',
		})
		expect(result.success).toBe(false)
	})

	it('rejects instructions longer than 10000 chars', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			instructions: 'a'.repeat(10001),
		})
		expect(result.success).toBe(false)
	})

	it('rejects invalid source URLs', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			sourceUrls: ['not-a-url'],
		})
		expect(result.success).toBe(false)
	})

	it('accepts valid HTTPS source URLs', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			sourceUrls: ['https://example.com/recipe'],
		})
		expect(result.success).toBe(true)
	})

	it('rejects HTTP source URLs', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			sourceUrls: ['http://example.com/recipe'],
		})
		expect(result.success).toBe(false)
	})

	it('rejects more than 2 source URLs', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			sourceUrls: ['https://a.com', 'https://b.com', 'https://c.com'],
		})
		expect(result.success).toBe(false)
	})
})

describe('UpdateProfileSchema', () => {
	it('accepts valid input', () => {
		const result = UpdateProfileSchema.safeParse({ name: 'John' })
		expect(result.success).toBe(true)
	})

	it('rejects empty name', () => {
		const result = UpdateProfileSchema.safeParse({ name: '' })
		expect(result.success).toBe(false)
	})

	it('rejects name longer than 40 chars', () => {
		const result = UpdateProfileSchema.safeParse({ name: 'a'.repeat(41) })
		expect(result.success).toBe(false)
	})

	it('accepts optional isPrivate boolean', () => {
		const result = UpdateProfileSchema.safeParse({
			name: 'John',
			isPrivate: true,
		})
		expect(result.success).toBe(true)
	})
})
