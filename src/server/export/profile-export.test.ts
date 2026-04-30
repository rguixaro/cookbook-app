import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/db', () => ({
	db: {
		user: {
			findUnique: vi.fn(),
		},
		recipe: {
			findMany: vi.fn(),
		},
	},
}))

vi.mock('@/lib/s3', () => ({
	getRecipeImageFromS3: vi.fn(),
}))

import { db } from '@/server/db'
import {
	buildProfileJsonPayload,
	collectProfileImagesExport,
	collectProfileJsonExport,
	exportTimestamp,
	safeExportFilename,
} from './profile-export'

const mockDb = vi.mocked(db, true)

const date = (value: string) => new Date(value)

const makeRecipe = (overrides: Record<string, unknown>) => ({
	id: 'recipe-real-owned',
	slug: 'owned-slug',
	name: 'Owned recipe',
	time: 30,
	instructions: 'Cook the owned recipe.',
	ingredients: ['salt'],
	images: ['images/recipe_real/owned.jpg'],
	sourceUrls: ['https://example.com/owned'],
	createdAt: date('2024-01-01T00:00:00.000Z'),
	updatedAt: date('2024-01-02T00:00:00.000Z'),
	course: 'FirstCourse',
	categories: ['Pasta'],
	authorId: 'user-real',
	author: {
		id: 'user-real',
		username: 'owner',
		name: 'Owner',
		image: 'https://example.com/owner.jpg',
		isPrivate: true,
	},
	...overrides,
})

beforeEach(() => {
	vi.clearAllMocks()
})

describe('safeExportFilename', () => {
	it('normalizes names for attachment filenames', () => {
		expect(safeExportFilename('Rúben Recipes!')).toBe('ruben-recipes')
		expect(safeExportFilename('***', 'fallback')).toBe('fallback')
	})

	it('formats export timestamps like roots image exports', () => {
		expect(exportTimestamp(date('2026-04-26T16:14:05.123Z'))).toBe(
			'20260426-161405',
		)
	})
})

describe('buildProfileJsonPayload', () => {
	it('uses synthetic IDs and image filenames instead of raw database values', () => {
		const payload = buildProfileJsonPayload({
			user: {
				id: 'user-real',
				username: 'owner',
				email: 'owner@example.com',
				name: 'Owner',
				image: null,
				isPrivate: true,
				createdAt: date('2024-01-01T00:00:00.000Z'),
				updatedAt: date('2024-01-02T00:00:00.000Z'),
				savedRecipes: ['recipe-real-saved'],
				favouriteRecipes: ['recipe-real-owned'],
			},
			recipes: [
				makeRecipe({}),
				makeRecipe({
					id: 'recipe-real-saved',
					slug: 'saved-slug',
					name: 'Saved recipe',
					images: ['images/recipe_real/saved.jpg'],
					authorId: 'public-user-real',
					author: {
						id: 'public-user-real',
						username: 'public',
						name: 'Public User',
						image: null,
						isPrivate: false,
					},
				}),
			],
			ids: {
				users: new Map([
					['user-real', 'user_0001'],
					['public-user-real', 'user_0002'],
				]),
				recipes: new Map([
					['recipe-real-owned', 'recipe_0001'],
					['recipe-real-saved', 'recipe_0002'],
				]),
				images: new Map([
					['images/recipe_real/owned.jpg', 'image_0001'],
					['images/recipe_real/saved.jpg', 'image_0002'],
				]),
				imageFiles: new Map([
					['images/recipe_real/owned.jpg', 'photos/0001-image_0001.jpg'],
					['images/recipe_real/saved.jpg', 'photos/0002-image_0002.jpg'],
				]),
			},
		} as any) as any

		const serialized = JSON.stringify(payload)

		expect(serialized).not.toContain('user-real')
		expect(serialized).not.toContain('public-user-real')
		expect(serialized).not.toContain('recipe-real-owned')
		expect(serialized).not.toContain('recipe-real-saved')
		expect(serialized).not.toContain('images/recipe_real')
		expect(payload.recipes[0].images).toEqual(['photos/0001-image_0001.jpg'])
		expect(payload.recipes[1].images).toEqual(['photos/0002-image_0002.jpg'])
		expect(payload.lists.favourites).toEqual(['recipe_0001'])
	})
})

describe('collectProfileJsonExport', () => {
	it('deduplicates authored recipes and excludes private saved/favourite recipes', async () => {
		mockDb.user.findUnique.mockResolvedValue({
			id: 'user-real',
			username: 'owner',
			email: 'owner@example.com',
			name: 'Owner',
			image: null,
			isPrivate: true,
			createdAt: date('2024-01-01T00:00:00.000Z'),
			updatedAt: date('2024-01-02T00:00:00.000Z'),
			savedRecipes: [
				'recipe-real-owned',
				'recipe-real-public-saved',
				'recipe-real-private-saved',
			],
			favouriteRecipes: [
				'recipe-real-public-favourite',
				'recipe-real-private-saved',
			],
		} as any)
		mockDb.recipe.findMany
			.mockResolvedValueOnce([makeRecipe({})] as any)
			.mockResolvedValueOnce([
				makeRecipe({
					id: 'recipe-real-public-saved',
					slug: 'public-saved',
					name: 'Public saved',
					createdAt: date('2024-02-01T00:00:00.000Z'),
					images: ['images/recipe_real/public-saved.jpg'],
					authorId: 'public-user-real',
					author: {
						id: 'public-user-real',
						username: 'public',
						name: 'Public User',
						image: null,
						isPrivate: false,
					},
				}),
				makeRecipe({
					id: 'recipe-real-public-favourite',
					slug: 'public-favourite',
					name: 'Public favourite',
					createdAt: date('2024-03-01T00:00:00.000Z'),
					images: [],
					authorId: 'public-user-real',
					author: {
						id: 'public-user-real',
						username: 'public',
						name: 'Public User',
						image: null,
						isPrivate: false,
					},
				}),
			] as any)

		const result = await collectProfileJsonExport('user-real')

		expect(result.error).toBe(false)
		if (result.error) return

		const payload = result.payload as any
		const serialized = JSON.stringify(payload)

		expect(result.filename).toMatch(/^owner-cookbook-export-\d{8}-\d{6}\.json$/)
		expect(payload.recipes).toHaveLength(3)
		expect(payload.lists.authored).toHaveLength(1)
		expect(payload.lists.saved).toHaveLength(2)
		expect(payload.lists.favourites).toHaveLength(1)
		expect(serialized).not.toContain('recipe-real-private-saved')
		expect(serialized).not.toContain('images/recipe_real')
		expect(mockDb.recipe.findMany).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				where: expect.objectContaining({
					author: { isPrivate: false },
				}),
			}),
		)
	})
})

describe('collectProfileImagesExport', () => {
	it('returns a valid ZIP stream with a manifest when there are no images', async () => {
		mockDb.user.findUnique.mockResolvedValue({
			id: 'user-real',
			username: 'owner',
			email: 'owner@example.com',
			name: 'Owner',
			image: null,
			isPrivate: true,
			createdAt: date('2024-01-01T00:00:00.000Z'),
			updatedAt: date('2024-01-02T00:00:00.000Z'),
			savedRecipes: [],
			favouriteRecipes: [],
		} as any)
		mockDb.recipe.findMany
			.mockResolvedValueOnce([makeRecipe({ images: [] })] as any)
			.mockResolvedValueOnce([] as any)

		const result = await collectProfileImagesExport('user-real')

		expect(result.error).toBe(false)
		if (result.error) return

		expect(result.filename).toMatch(/^owner-recipe-images-\d{8}-\d{6}\.zip$/)

		const chunks: Uint8Array[] = []
		const reader = result.stream.getReader()
		while (true) {
			const next = await reader.read()
			if (next.done) break
			chunks.push(next.value)
		}
		const text = new TextDecoder().decode(
			Uint8Array.from(chunks.flatMap((chunk) => Array.from(chunk))),
		)

		expect(text).toContain('manifest.json')
		expect(text).toContain('"schemaVersion": 4')
	})
})
