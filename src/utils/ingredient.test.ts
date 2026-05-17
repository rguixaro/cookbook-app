import { describe, expect, it } from 'vitest'

import { formatIngredientLabel } from './ingredient'

describe('formatIngredientLabel', () => {
	it('capitalizes the first character without changing the rest', () => {
		expect(formatIngredientLabel('olive oil')).toBe('Olive oil')
		expect(formatIngredientLabel('pecorino romano')).toBe('Pecorino romano')
	})

	it('trims display whitespace', () => {
		expect(formatIngredientLabel('  eggs  ')).toBe('Eggs')
	})

	it('keeps empty strings unchanged', () => {
		expect(formatIngredientLabel('')).toBe('')
	})
})
