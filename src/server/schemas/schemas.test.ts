import { describe, it, expect } from 'vitest'
import { CreateRecipeSchema, UpdateProfileSchema } from './index'

const validRecipe = {
	name: 'Paella Valenciana',
	category: 'Fish' as const,
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

	it('rejects invalid category', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			category: 'Pizza',
		})
		expect(result.success).toBe(false)
	})

	it('accepts all valid categories', () => {
		const categories = [
			'Starter',
			'Pasta',
			'Meat',
			'Fish',
			'Vegetable',
			'Salad',
			'Soup',
			'Dessert',
		]
		for (const category of categories) {
			const result = CreateRecipeSchema.safeParse({ ...validRecipe, category })
			expect(result.success).toBe(true)
		}
	})

	it('rejects time less than 1', () => {
		const result = CreateRecipeSchema.safeParse({ ...validRecipe, time: 0 })
		expect(result.success).toBe(false)
	})

	it('rejects time greater than 10080', () => {
		const result = CreateRecipeSchema.safeParse({ ...validRecipe, time: 10081 })
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

	it('rejects more than 2 source URLs', () => {
		const result = CreateRecipeSchema.safeParse({
			...validRecipe,
			sourceUrls: [
				'https://a.com',
				'https://b.com',
				'https://c.com',
			],
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
