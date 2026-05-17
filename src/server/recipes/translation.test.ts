import { describe, expect, it } from 'vitest'

import { resolveRecipeTranslation } from './translation'

const makeRecipe = (overrides: Record<string, unknown> = {}) => ({
	slug: 'sample',
	defaultLocale: 'es',
	translations: [
		{
			locale: 'en',
			name: 'English',
			ingredients: ['en'],
			instructions: 'English instructions',
			complements: [],
		},
		{
			locale: 'es',
			name: 'Spanish',
			ingredients: ['es'],
			instructions: 'Spanish instructions',
			complements: [],
		},
		{
			locale: 'ca',
			name: 'Catalan',
			ingredients: ['ca'],
			instructions: 'Catalan instructions',
			complements: [],
		},
	],
	...overrides,
})

describe('resolveRecipeTranslation', () => {
	it('chooses the requested locale first', () => {
		const translation = resolveRecipeTranslation(makeRecipe(), 'ca')
		expect(translation.name).toBe('Catalan')
	})

	it('falls back to the recipe default locale', () => {
		const translation = resolveRecipeTranslation(
			makeRecipe({
				translations: [
					{
						locale: 'es',
						name: 'Spanish',
						ingredients: ['es'],
						instructions: 'Spanish instructions',
						complements: [],
					},
				],
			}),
			'ca',
		)

		expect(translation.name).toBe('Spanish')
	})

	it('falls back to English when default locale is unavailable', () => {
		const translation = resolveRecipeTranslation(
			makeRecipe({
				defaultLocale: 'ca',
				translations: [
					{
						locale: 'en',
						name: 'English',
						ingredients: ['en'],
						instructions: 'English instructions',
						complements: [],
					},
				],
			}),
			'es',
		)

		expect(translation.name).toBe('English')
	})

	it('falls back to the first available translation', () => {
		const translation = resolveRecipeTranslation(
			makeRecipe({
				defaultLocale: 'en',
				translations: [
					{
						locale: 'ca',
						name: 'Catalan',
						ingredients: ['ca'],
						instructions: 'Catalan instructions',
						complements: [],
					},
				],
			}),
			'es',
		)

		expect(translation.name).toBe('Catalan')
	})
})
