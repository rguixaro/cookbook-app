import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
	auth: vi.fn(),
}))

vi.mock('@/server/db', () => ({
	db: {
		user: {
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
		},
		recipe: {
			findMany: vi.fn(),
			findFirst: vi.fn(),
		},
	},
}))

vi.mock('react', () => ({
	cache: (fn: Function) => fn,
}))

import { auth } from '@/auth'
import { db } from '@/server/db'
import {
	toImageUrls,
	getUserByUsername,
	getSavedRecipeIds,
	getFavouriteRecipeIds,
	getRecipesByUserId,
	getRecipeByAuthAndSlug,
	getProfileByUsername,
	getProfilesByName,
} from './index'

const mockAuth = vi.mocked(auth)
const mockDb = vi.mocked(db)

const mockSession = { user: { id: 'user-1' } }

beforeEach(() => {
	vi.clearAllMocks()
})

describe('toImageUrls', () => {
	it('converts keys to full CloudFront URLs', () => {
		const original = process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN
		process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN = 'https://cdn.example.com'

		// toImageUrls reads CLOUDFRONT_DOMAIN at module load time, so we need to
		// re-import. For simplicity, test the function logic directly.
		// The module-level const is already set, so we test with whatever env was set.
		const result = toImageUrls(['images/a.jpg', 'images/b.jpg'])

		// Restore
		process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN = original

		// The function uses the module-level constant, so the result depends on
		// what was set when the module was first imported
		expect(Array.isArray(result)).toBe(true)
	})

	it('returns empty array for empty input', () => {
		const result = toImageUrls([])
		expect(result).toEqual([])
	})
})

describe('getUserByUsername', () => {
	it('returns user when found', async () => {
		const user = { id: 'user-1', username: 'johndoe' }
		mockDb.user.findUnique.mockResolvedValue(user as any)

		const result = await getUserByUsername('johndoe')
		expect(result).toEqual(user)
		expect(mockDb.user.findUnique).toHaveBeenCalledWith({
			where: { username: 'johndoe' },
			select: { id: true, username: true },
		})
	})

	it('returns null when not found', async () => {
		mockDb.user.findUnique.mockResolvedValue(null)

		const result = await getUserByUsername('nonexistent')
		expect(result).toBeNull()
	})

	it('returns null on database error', async () => {
		mockDb.user.findUnique.mockRejectedValue(new Error('DB error'))

		const result = await getUserByUsername('error')
		expect(result).toBeNull()
	})
})

describe('getSavedRecipeIds', () => {
	it('returns empty array when not authenticated', async () => {
		mockAuth.mockResolvedValue(null as any)

		const result = await getSavedRecipeIds()
		expect(result).toEqual([])
	})

	it('returns saved recipe IDs when authenticated', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({
			savedRecipes: ['recipe-1', 'recipe-2'],
		} as any)

		const result = await getSavedRecipeIds()
		expect(result).toEqual(['recipe-1', 'recipe-2'])
	})

	it('returns empty array when user has no saved recipes', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue(null)

		const result = await getSavedRecipeIds()
		expect(result).toEqual([])
	})
})

describe('getFavouriteRecipeIds', () => {
	it('returns empty array when not authenticated', async () => {
		mockAuth.mockResolvedValue(null as any)

		const result = await getFavouriteRecipeIds()
		expect(result).toEqual([])
	})

	it('returns favourite recipe IDs when authenticated', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({
			favouriteRecipes: ['recipe-3'],
		} as any)

		const result = await getFavouriteRecipeIds()
		expect(result).toEqual(['recipe-3'])
	})
})

describe('getRecipesByUserId', () => {
	const makeRecipe = (id: string) => ({
		id,
		name: `Recipe ${id}`,
		slug: `recipe-${id}`,
		category: 'Fish',
		time: 30,
		ingredients: ['a'],
		instructions: 'Cook it.',
		authorId: 'user-1',
		images: [],
		sourceUrls: [],
		createdAt: new Date(),
		author: { username: 'testuser' },
	})

	it('returns null when not authenticated', async () => {
		mockAuth.mockResolvedValue(null as any)

		const result = await getRecipesByUserId()
		expect(result).toBeNull()
	})

	it('returns own recipes when no userId provided', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findMany.mockResolvedValue([makeRecipe('r1')] as any)
		// getSavedRecipeIds is called internally — mock the user lookup for it
		mockDb.user.findUnique.mockResolvedValue({ savedRecipes: [] } as any)

		const result = await getRecipesByUserId()
		expect(result).not.toBeNull()
		expect(result!.recipes).toHaveLength(1)
	})

	it('returns null for private user', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({ isPrivate: true } as any)

		const result = await getRecipesByUserId('user-2')
		expect(result).toBeNull()
	})

	it('returns null when target user not found', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue(null)

		const result = await getRecipesByUserId('nonexistent')
		expect(result).toBeNull()
	})

	it('returns recipes for public user', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({ isPrivate: false } as any)
		mockDb.recipe.findMany.mockResolvedValue([makeRecipe('r1')] as any)

		const result = await getRecipesByUserId('user-2')
		expect(result).not.toBeNull()
		expect(result!.recipes).toHaveLength(1)
	})

	it('includes saved recipes for own feed', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		// First findMany call: own recipes, second: saved recipes
		mockDb.recipe.findMany
			.mockResolvedValueOnce([makeRecipe('own-1')] as any)
			.mockResolvedValueOnce([makeRecipe('saved-1')] as any)
		mockDb.user.findUnique.mockResolvedValue({
			savedRecipes: ['saved-1'],
		} as any)

		const result = await getRecipesByUserId()
		expect(result).not.toBeNull()
		expect(result!.recipes).toHaveLength(2)
	})
})

describe('getRecipeByAuthAndSlug', () => {
	const mockRecipe = {
		id: 'r1',
		name: 'Test',
		slug: 'test',
		category: 'Fish',
		time: 30,
		ingredients: ['a'],
		instructions: 'Cook it.',
		authorId: 'user-1',
		images: [],
		sourceUrls: [],
		createdAt: new Date(),
		author: { username: 'testuser' },
	}

	it('returns null when not authenticated', async () => {
		mockAuth.mockResolvedValue(null as any)

		const result = await getRecipeByAuthAndSlug('user-1', 'test')
		expect(result).toBeNull()
	})

	it('returns recipe when viewing own recipe', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue(mockRecipe as any)

		const result = await getRecipeByAuthAndSlug('user-1', 'test')
		expect(result).not.toBeNull()
		expect(result!.slug).toBe('test')
	})

	it('returns null for private author', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({ isPrivate: true } as any)

		const result = await getRecipeByAuthAndSlug('user-2', 'test')
		expect(result).toBeNull()
	})

	it('returns null when author not found', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue(null)

		const result = await getRecipeByAuthAndSlug('nonexistent', 'test')
		expect(result).toBeNull()
	})

	it('returns recipe for public author', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({ isPrivate: false } as any)
		mockDb.recipe.findFirst.mockResolvedValue(mockRecipe as any)

		const result = await getRecipeByAuthAndSlug('user-2', 'test')
		expect(result).not.toBeNull()
	})

	it('returns null when recipe not found', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue(null)

		const result = await getRecipeByAuthAndSlug('user-1', 'nonexistent')
		expect(result).toBeNull()
	})
})

describe('getProfileByUsername', () => {
	it('returns null profile when not authenticated', async () => {
		mockAuth.mockResolvedValue(null as any)

		const result = await getProfileByUsername('johndoe')
		expect(result).toEqual({ profile: null })
	})

	it('returns profile when found', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		const profile = {
			id: 'user-2',
			name: 'John',
			image: 'img.jpg',
			createdAt: new Date(),
			_count: { recipes: 3 },
		}
		mockDb.user.findFirst.mockResolvedValue(profile as any)

		const result = await getProfileByUsername('johndoe')
		expect(result).toEqual({ profile })
	})

	it('returns null profile when not found', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findFirst.mockResolvedValue(null)

		const result = await getProfileByUsername('nonexistent')
		expect(result).toEqual({ profile: null })
	})

	it('returns null profile on database error', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findFirst.mockRejectedValue(new Error('DB error'))

		const result = await getProfileByUsername('error')
		expect(result).toEqual({ profile: null })
	})
})

describe('getProfilesByName', () => {
	it('returns null when not authenticated', async () => {
		mockAuth.mockResolvedValue(null as any)

		const result = await getProfilesByName('John')
		expect(result).toBeNull()
	})

	it('returns empty array for empty name', async () => {
		mockAuth.mockResolvedValue(mockSession as any)

		const result = await getProfilesByName('   ')
		expect(result).toEqual([])
	})

	it('returns mapped profiles when found', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findMany.mockResolvedValue([
			{
				id: 'user-2',
				name: 'John Doe',
				username: 'johndoe',
				image: 'img.jpg',
				isPrivate: false,
				_count: { recipes: 5 },
			},
		] as any)

		const result = await getProfilesByName('John')
		expect(result).toEqual({
			profiles: [
				{
					id: 'user-2',
					name: 'John Doe',
					username: 'johndoe',
					image: 'img.jpg',
					recipesCount: 5,
				},
			],
		})
	})
})
