import { describe, it, expect } from 'vitest'
import { slugify, formatLongSentence } from './utils'

describe('slugify', () => {
	it('converts basic string to slug', () => {
		expect(slugify('Hello World')).toBe('hello-world')
	})

	it('removes diacritics', () => {
		expect(slugify('Crème Brûlée')).toBe('creme-brulee')
	})

	it('removes special characters', () => {
		expect(slugify('Pasta & Cheese!')).toBe('pasta-cheese')
	})

	it('collapses multiple hyphens', () => {
		expect(slugify('a---b')).toBe('a-b')
	})

	it('trims leading and trailing hyphens', () => {
		expect(slugify('--hello--')).toBe('hello')
	})

	it('handles multiple spaces', () => {
		expect(slugify('hello   world')).toBe('hello-world')
	})

	it('returns empty string for empty input', () => {
		expect(slugify('')).toBe('')
	})

	it('handles string with only special chars', () => {
		expect(slugify('!@#$%')).toBe('')
	})

	it('preserves numbers', () => {
		expect(slugify('Recipe 123')).toBe('recipe-123')
	})

	it('handles Catalan characters', () => {
		expect(slugify('Paella Valenciana')).toBe('paella-valenciana')
		expect(slugify('Crema Catalana')).toBe('crema-catalana')
	})
})

describe('formatLongSentence', () => {
	it('capitalizes first letter and lowercases rest', () => {
		expect(formatLongSentence('HELLO WORLD')).toBe('Hello world')
	})

	it('handles multiple sentences separated by periods', () => {
		expect(formatLongSentence('FIRST SENTENCE. SECOND SENTENCE')).toBe(
			'First sentence. Second sentence',
		)
	})

	it('trims whitespace', () => {
		expect(formatLongSentence('  hello world  ')).toBe('Hello world')
	})

	it('handles empty string', () => {
		expect(formatLongSentence('')).toBe('')
	})

	it('handles single word', () => {
		expect(formatLongSentence('HELLO')).toBe('Hello')
	})

	it('handles sentence with trailing period', () => {
		expect(formatLongSentence('HELLO WORLD.')).toBe('Hello world.')
	})
})
