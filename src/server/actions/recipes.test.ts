/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

vi.mock('@/auth', () => ({
	auth: vi.fn(),
}))

vi.mock('@/server/db', () => ({
	db: {
		user: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
		},
		recipe: {
			create: vi.fn(),
			findFirst: vi.fn(),
			findUnique: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	},
}))

vi.mock('next/cache', () => ({
	revalidatePath: vi.fn(),
}))

vi.mock('@/lib/s3', () => ({
	deleteRecipeImages: vi.fn(),
	uploadRecipeImage: vi.fn(),
}))

vi.mock('@/server/queries', () => ({
	toImageUrls: vi.fn((keys: string[]) =>
		keys.map((k) => `https://cdn.example.com/${k}`),
	),
}))

import { auth } from '@/auth'
import { db } from '@/server/db'
import { revalidatePath } from 'next/cache'
import {
	fetchRecipes,
	createRecipe,
	updateRecipe,
	saveRecipe,
	favouriteRecipe,
	deleteRecipe,
	uploadRecipeImages,
	updateRecipeImages,
} from './recipes'

const mockAuth = vi.mocked(auth)
const mockDb = vi.mocked(db, true)
const mockRevalidatePath = vi.mocked(revalidatePath)

const mockSession = { user: { id: 'user-1' } }

const validRecipeInput = {
	name: 'Paella Valenciana',
	course: 'SecondCourse' as const,
	categories: ['Fish', 'Rice'] as const,
	time: 60,
	ingredients: ['rice', 'shrimp', 'saffron'],
	instructions: 'Cook the rice with the shrimp and saffron in a large pan.',
	sourceUrls: [],
}

beforeEach(() => {
	vi.clearAllMocks()
})

describe('fetchRecipes', () => {
	const makeRecipe = (id: string, authorId = 'user-1') => ({
		id,
		name: `Recipe ${id}`,
		slug: `recipe-${id}`,
		course: 'SecondCourse',
		categories: ['Fish'],
		time: 30,
		ingredients: ['a'],
		instructions: 'Do the thing.',
		authorId,
		images: [],
		sourceUrls: [],
		createdAt: new Date(),
		author: { username: 'testuser' },
	})

	it('returns empty when not authenticated', async () => {
		mockAuth.mockResolvedValue(null as any)

		const result = await fetchRecipes({})
		expect(result).toEqual({ recipes: [], nextCursor: null })
	})

	it('returns recipes for own feed (own + saved)', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({
			savedRecipes: ['recipe-saved'],
		} as any)
		mockDb.recipe.findMany.mockResolvedValue([makeRecipe('r1')] as any)

		const result = await fetchRecipes({})
		expect(result.recipes).toHaveLength(1)
		expect(result.nextCursor).toBeNull()
	})

	it('returns empty when viewing private user recipes', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({ isPrivate: true } as any)

		const result = await fetchRecipes({ userId: 'user-2' })
		expect(result).toEqual({ recipes: [], nextCursor: null })
	})

	it('returns empty when target user not found', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue(null)

		const result = await fetchRecipes({ userId: 'nonexistent' })
		expect(result).toEqual({ recipes: [], nextCursor: null })
	})

	it('returns recipes for public user', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({ isPrivate: false } as any)
		mockDb.recipe.findMany.mockResolvedValue([
			makeRecipe('r1', 'user-2'),
		] as any)

		const result = await fetchRecipes({ userId: 'user-2' })
		expect(result.recipes).toHaveLength(1)
	})

	it('skips privacy check when viewing own recipes by userId', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findMany.mockResolvedValue([makeRecipe('r1')] as any)

		const result = await fetchRecipes({ userId: 'user-1' })
		expect(result.recipes).toHaveLength(1)
		expect(mockDb.user.findUnique).not.toHaveBeenCalled()
	})

	it('provides nextCursor when more results exist', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({ savedRecipes: [] } as any)
		const recipes = Array.from({ length: 11 }, (_, i) => makeRecipe(`r${i}`))
		mockDb.recipe.findMany.mockResolvedValue(recipes as any)

		const result = await fetchRecipes({})
		expect(result.recipes).toHaveLength(10)
		expect(result.nextCursor).toBe('r9')
	})

	it('caps take at 50', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({ savedRecipes: [] } as any)
		mockDb.recipe.findMany.mockResolvedValue([] as any)

		await fetchRecipes({ take: 100 })
		expect(mockDb.recipe.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ take: 51 }),
		)
	})

	it('returns empty for favourites with no favourite IDs', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({
			favouriteRecipes: [],
		} as any)

		const result = await fetchRecipes({ favourites: true })
		expect(result).toEqual({ recipes: [], nextCursor: null })
	})

	it('returns empty for saved filter with no saved IDs', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({
			savedRecipes: [],
		} as any)

		const result = await fetchRecipes({ saved: true, userId: 'user-1' })
		expect(result).toEqual({ recipes: [], nextCursor: null })
	})

	it('filters a public user profile by current user saved recipes', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique
			.mockResolvedValueOnce({ isPrivate: false } as any)
			.mockResolvedValueOnce({ savedRecipes: ['recipe-saved'] } as any)
		mockDb.recipe.findMany.mockResolvedValue([
			makeRecipe('recipe-saved', 'user-2'),
		] as any)

		await fetchRecipes({ saved: true, userId: 'user-2' })

		expect(mockDb.recipe.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					authorId: 'user-2',
					id: { in: ['recipe-saved'] },
				}),
			}),
		)
	})

	it('filters by category', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({ savedRecipes: [] } as any)
		mockDb.recipe.findMany.mockResolvedValue([makeRecipe('r1')] as any)

		await fetchRecipes({ course: 'SecondCourse' })
		expect(mockDb.recipe.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ course: 'SecondCourse' }),
			}),
		)
	})

	it('filters by categories using match-any semantics', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({ savedRecipes: [] } as any)
		mockDb.recipe.findMany.mockResolvedValue([makeRecipe('r1')] as any)

		await fetchRecipes({ categories: 'Fish,Wok,InvalidCategory' })
		expect(mockDb.recipe.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					categories: { hasSome: ['Fish', 'Wok'] },
				}),
			}),
		)
	})

	it('ignores invalid category', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({ savedRecipes: [] } as any)
		mockDb.recipe.findMany.mockResolvedValue([] as any)

		await fetchRecipes({ course: 'InvalidCourse' })
		const call = mockDb.recipe.findMany.mock.calls[0][0] as any
		expect(call.where.course).toBeUndefined()
		expect(JSON.stringify(call.where)).not.toContain('InvalidCourse')
	})

	it('passes cursor for pagination', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({ savedRecipes: [] } as any)
		mockDb.recipe.findMany.mockResolvedValue([] as any)

		await fetchRecipes({ cursor: 'cursor-id' })
		expect(mockDb.recipe.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				cursor: { id: 'cursor-id' },
				skip: 1,
			}),
		)
	})

	it('sorts by creation date ascending', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({ savedRecipes: [] } as any)
		mockDb.recipe.findMany.mockResolvedValue([] as any)

		await fetchRecipes({ sort: 'createdAtAsc' })

		expect(mockDb.recipe.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
			}),
		)
	})

	it('sorts by cooking time ascending with missing times last', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({ savedRecipes: [] } as any)
		mockDb.recipe.findMany.mockResolvedValue([
			{
				...makeRecipe('slow'),
				time: 90,
				createdAt: new Date('2025-02-01'),
			},
			{
				...makeRecipe('no-time'),
				time: null,
				createdAt: new Date('2025-01-01'),
			},
			{
				...makeRecipe('quick'),
				time: 15,
				createdAt: new Date('2025-03-01'),
			},
		] as any)

		const result = await fetchRecipes({ sort: 'timeAsc' })

		expect(result.recipes.map((recipe) => recipe.id)).toEqual([
			'quick',
			'slow',
			'no-time',
		])
		expect(mockDb.recipe.findMany).toHaveBeenCalledWith(
			expect.not.objectContaining({
				take: expect.any(Number),
			}),
		)
	})

	it('sorts by cooking time descending with missing times last', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({ savedRecipes: [] } as any)
		mockDb.recipe.findMany.mockResolvedValue([
			{
				...makeRecipe('quick'),
				time: 15,
				createdAt: new Date('2025-02-01'),
			},
			{
				...makeRecipe('no-time'),
				time: null,
				createdAt: new Date('2025-01-01'),
			},
			{
				...makeRecipe('slow'),
				time: 90,
				createdAt: new Date('2025-03-01'),
			},
		] as any)

		const result = await fetchRecipes({ sort: 'timeDesc' })

		expect(result.recipes.map((recipe) => recipe.id)).toEqual([
			'slow',
			'quick',
			'no-time',
		])
	})

	it('normalizes unknown sort URLs to the default date order', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({ savedRecipes: [] } as any)
		mockDb.recipe.findMany.mockResolvedValue([] as any)

		await fetchRecipes({ sort: 'unsupportedSort' })

		expect(mockDb.recipe.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
				take: 11,
			}),
		)
		expect(mockDb.user.findMany).not.toHaveBeenCalled()
	})

	it('returns empty on database error', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({ savedRecipes: [] } as any)
		mockDb.recipe.findMany.mockRejectedValue(new Error('DB down'))

		const result = await fetchRecipes({})
		expect(result).toEqual({ recipes: [], nextCursor: null })
	})
})

describe('createRecipe', () => {
	it('returns error when not authenticated', async () => {
		mockAuth.mockResolvedValue(null as any)

		const result = await createRecipe(validRecipeInput)
		expect(result).toEqual({ error: true, message: 'error' })
	})

	it('returns error for invalid input', async () => {
		mockAuth.mockResolvedValue(mockSession as any)

		const result = await createRecipe({ name: 'ab' })
		expect(result).toEqual({ error: true, message: 'error' })
	})

	it('creates recipe with valid input', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.create.mockResolvedValue({
			id: 'recipe-1',
			slug: 'paella-valenciana',
			author: { username: 'testuser' },
		} as any)

		const result = await createRecipe(validRecipeInput)
		expect(result).toEqual({
			error: false,
			recipeId: 'recipe-1',
			recipePath: '/recipes/testuser/paella-valenciana',
		})
		expect(mockDb.recipe.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				name: 'Paella Valenciana',
				course: 'SecondCourse',
				categories: ['Fish', 'Rice'],
				ingredients: ['rice', 'shrimp', 'saffron'],
				complements: [],
				slug: 'paella-valenciana',
				authorId: 'user-1',
			}),
			include: { author: { select: { username: true } } },
		})
	})

	it('persists complement data separately from main recipe fields', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.create.mockResolvedValue({
			id: 'recipe-1',
			slug: 'paella-valenciana',
			author: { username: 'testuser' },
		} as any)

		const complements = [
			{
				type: 'Sauce' as const,
				ingredients: ['tomato', 'olive oil'],
				instructions: 'Simmer the tomato and oil until glossy.',
			},
		]

		const result = await createRecipe({
			...validRecipeInput,
			complements,
		})

		expect(result.error).toBe(false)
		expect(mockDb.recipe.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					ingredients: validRecipeInput.ingredients,
					instructions: validRecipeInput.instructions,
					complements,
				}),
			}),
		)
	})

	it('returns error on duplicate slug (P2002)', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		const prismaError = new Prisma.PrismaClientKnownRequestError(
			'Unique constraint',
			{
				code: 'P2002',
				clientVersion: '5.0.0',
			},
		)
		mockDb.recipe.create.mockRejectedValue(prismaError)

		const result = await createRecipe(validRecipeInput)
		expect(result).toEqual({ error: true, message: 'error-recipe-exists' })
	})

	it('returns error for name that produces empty slug', async () => {
		mockAuth.mockResolvedValue(mockSession as any)

		const result = await createRecipe({
			...validRecipeInput,
			name: '!!!',
		})
		expect(result).toEqual({
			error: true,
			message: 'error-recipe-name-invalid',
		})
	})
})

describe('updateRecipe', () => {
	it('returns error when not authenticated', async () => {
		mockAuth.mockResolvedValue(null as any)

		const result = await updateRecipe('recipe-1', validRecipeInput)
		expect(result).toEqual({ error: true, message: 'error' })
	})

	it('returns error for invalid input', async () => {
		mockAuth.mockResolvedValue(mockSession as any)

		const result = await updateRecipe('recipe-1', { name: 'ab' })
		expect(result).toEqual({ error: true, message: 'error' })
	})

	it('returns error when recipe not found or not owned', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue(null)

		const result = await updateRecipe('recipe-1', validRecipeInput)
		expect(result).toEqual({ error: true, message: 'error' })
	})

	it('updates recipe successfully', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue({
			id: 'recipe-1',
			slug: 'old-paella',
			author: { username: 'testuser' },
		} as any)
		mockDb.recipe.update.mockResolvedValue({} as any)

		const result = await updateRecipe('recipe-1', validRecipeInput)
		expect(result).toEqual({
			error: false,
			recipeId: 'recipe-1',
			recipePath: '/recipes/testuser/paella-valenciana',
		})
		expect(mockDb.recipe.update).toHaveBeenCalled()
	})

	it('updates complement data separately from main recipe fields', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue({
			id: 'recipe-1',
			slug: 'old-paella',
			ingredients: validRecipeInput.ingredients,
			author: { username: 'testuser' },
		} as any)
		mockDb.recipe.update.mockResolvedValue({} as any)

		const complements = [
			{
				type: 'Marinade' as const,
				ingredients: ['lemon', 'garlic'],
				instructions: 'Mix the lemon and garlic and rest the fish.',
			},
		]

		const result = await updateRecipe('recipe-1', {
			...validRecipeInput,
			complements,
		})

		expect(result.error).toBe(false)
		expect(mockDb.recipe.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					ingredients: validRecipeInput.ingredients,
					instructions: validRecipeInput.instructions,
					complements,
				}),
			}),
		)
	})

	it('updates recipe with unchanged legacy overlong ingredient', async () => {
		const legacyIngredient = 'very long preserved lemon ingredient name'
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue({
			id: 'recipe-1',
			slug: 'old-paella',
			ingredients: [legacyIngredient],
			author: { username: 'testuser' },
		} as any)
		mockDb.recipe.update.mockResolvedValue({} as any)

		const result = await updateRecipe('recipe-1', {
			...validRecipeInput,
			ingredients: [legacyIngredient],
		})

		expect(result).toEqual({
			error: false,
			recipeId: 'recipe-1',
			recipePath: '/recipes/testuser/paella-valenciana',
		})
		expect(mockDb.recipe.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					ingredients: [legacyIngredient],
				}),
			}),
		)
	})

	it('rejects changed legacy overlong ingredient', async () => {
		const legacyIngredient = 'very long preserved lemon ingredient name'
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue({
			id: 'recipe-1',
			slug: 'old-paella',
			ingredients: [legacyIngredient],
			author: { username: 'testuser' },
		} as any)

		const result = await updateRecipe('recipe-1', {
			...validRecipeInput,
			ingredients: [`${legacyIngredient} changed`],
		})

		expect(result).toEqual({ error: true, message: 'error' })
		expect(mockDb.recipe.update).not.toHaveBeenCalled()
	})
})

describe('saveRecipe', () => {
	it('returns error when not authenticated', async () => {
		mockAuth.mockResolvedValue(null as any)

		const result = await saveRecipe('recipe-1', false)
		expect(result).toEqual({ error: true })
	})

	it('returns error when recipe does not exist', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findUnique.mockResolvedValue(null)

		const result = await saveRecipe('nonexistent', false)
		expect(result).toEqual({ error: true })
	})

	it('saves a recipe atomically via updateMany', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findUnique.mockResolvedValue({ id: 'recipe-1' } as any)
		mockDb.user.updateMany.mockResolvedValue({ count: 1 } as any)

		const result = await saveRecipe('recipe-1', false)
		expect(result).toEqual({ error: false })
		expect(mockDb.user.updateMany).toHaveBeenCalledWith({
			where: {
				id: 'user-1',
				NOT: { savedRecipes: { has: 'recipe-1' } },
			},
			data: { savedRecipes: { push: 'recipe-1' } },
		})
	})

	it('unsaves a recipe (removes from saved and favourites)', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findUnique.mockResolvedValue({ id: 'recipe-1' } as any)
		mockDb.user.findUnique.mockResolvedValue({
			savedRecipes: ['recipe-1', 'recipe-2'],
			favouriteRecipes: ['recipe-1'],
		} as any)
		mockDb.user.update.mockResolvedValue({} as any)

		const result = await saveRecipe('recipe-1', true)
		expect(result).toEqual({ error: false })
		expect(mockDb.user.update).toHaveBeenCalledWith({
			where: { id: 'user-1' },
			data: {
				savedRecipes: { set: ['recipe-2'] },
				favouriteRecipes: { set: [] },
			},
		})
	})
})

describe('favouriteRecipe', () => {
	it('returns error when not authenticated', async () => {
		mockAuth.mockResolvedValue(null as any)

		const result = await favouriteRecipe('recipe-1', false)
		expect(result).toEqual({ error: true })
	})

	it('favourites a recipe atomically via updateMany', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findUnique.mockResolvedValue({ id: 'recipe-1' } as any)
		mockDb.user.updateMany.mockResolvedValue({ count: 1 } as any)

		const result = await favouriteRecipe('recipe-1', false)
		expect(result).toEqual({ error: false })
		expect(mockDb.user.updateMany).toHaveBeenCalledWith({
			where: {
				id: 'user-1',
				NOT: { favouriteRecipes: { has: 'recipe-1' } },
			},
			data: { favouriteRecipes: { push: 'recipe-1' } },
		})
	})

	it('unfavourites a recipe', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findUnique.mockResolvedValue({ id: 'recipe-1' } as any)
		mockDb.user.findUnique.mockResolvedValue({
			favouriteRecipes: ['recipe-1', 'recipe-2'],
		} as any)
		mockDb.user.update.mockResolvedValue({} as any)

		const result = await favouriteRecipe('recipe-1', true)
		expect(result).toEqual({ error: false })
		expect(mockDb.user.update).toHaveBeenCalledWith({
			where: { id: 'user-1' },
			data: {
				favouriteRecipes: { set: ['recipe-2'] },
			},
		})
	})
})

describe('deleteRecipe', () => {
	it('returns error when not authenticated', async () => {
		mockAuth.mockResolvedValue(null as any)

		const result = await deleteRecipe('recipe-1')
		expect(result).toEqual({ error: true })
	})

	it('returns error when recipe not found or not owned', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue(null)

		const result = await deleteRecipe('recipe-1')
		expect(result).toEqual({ error: true })
	})

	it('deletes recipe with no images', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue({
			images: [],
			slug: 'paella-valenciana',
			author: { username: 'testuser' },
		} as any)
		mockDb.recipe.delete.mockResolvedValue({} as any)
		mockDb.user.findMany.mockResolvedValue([])

		const result = await deleteRecipe('recipe-1')
		expect(result).toEqual({ error: false })
		expect(mockDb.recipe.delete).toHaveBeenCalled()
		expect(mockRevalidatePath).toHaveBeenCalledWith('/')
		expect(mockRevalidatePath).toHaveBeenCalledWith('/recipes')
		expect(mockRevalidatePath).toHaveBeenCalledWith(
			'/recipes/testuser/paella-valenciana',
		)
		expect(mockRevalidatePath).toHaveBeenCalledWith('/profiles/testuser')
	})

	it('deletes recipe and cleans up S3 images', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue({
			images: ['img1.jpg', 'img2.jpg'],
		} as any)
		mockDb.recipe.delete.mockResolvedValue({} as any)
		mockDb.user.findMany.mockResolvedValue([])

		const { deleteRecipeImages } = await import('@/lib/s3')
		vi.mocked(deleteRecipeImages).mockResolvedValue(undefined)

		const result = await deleteRecipe('recipe-1')
		expect(result).toEqual({ error: false })
		expect(deleteRecipeImages).toHaveBeenCalledWith(['img1.jpg', 'img2.jpg'])
	})

	it('cleans up dangling references in other users', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue({ images: [] } as any)
		mockDb.recipe.delete.mockResolvedValue({} as any)
		mockDb.user.findMany.mockResolvedValue([
			{
				id: 'user-2',
				savedRecipes: ['recipe-1', 'recipe-3'],
				favouriteRecipes: ['recipe-1'],
			},
		] as any)
		mockDb.user.update.mockResolvedValue({} as any)

		const result = await deleteRecipe('recipe-1')
		expect(result).toEqual({ error: false })
		expect(mockDb.user.update).toHaveBeenCalledWith({
			where: { id: 'user-2' },
			data: {
				savedRecipes: { set: ['recipe-3'] },
				favouriteRecipes: { set: [] },
			},
		})
	})
})

describe('uploadRecipeImages', () => {
	const makeFormData = (...files: File[]) => {
		const fd = new FormData()
		files.forEach((f) => fd.append('images', f))
		return fd
	}

	const makeFile = (name: string) =>
		new File(['content'], name, { type: 'image/jpeg' })

	it('returns error when not authenticated', async () => {
		mockAuth.mockResolvedValue(null as any)

		const result = await uploadRecipeImages(
			'recipe-1',
			makeFormData(makeFile('a.jpg')),
		)
		expect(result).toEqual({ error: true })
	})

	it('returns error when recipe not found or not owned', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue(null)

		const result = await uploadRecipeImages(
			'recipe-1',
			makeFormData(makeFile('a.jpg')),
		)
		expect(result).toEqual({ error: true })
	})

	it('returns error when no files provided', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue({ images: [] } as any)

		const result = await uploadRecipeImages('recipe-1', new FormData())
		expect(result).toEqual({ error: true })
	})

	it('returns error when uploading more than 3 files at once', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue({
			images: [],
		} as any)

		const result = await uploadRecipeImages(
			'recipe-1',
			makeFormData(
				makeFile('a.jpg'),
				makeFile('b.jpg'),
				makeFile('c.jpg'),
				makeFile('d.jpg'),
			),
		)
		expect(result).toEqual({ error: true })
	})

	it('allows upload when replacing images (existing + new exceeds 3)', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue({
			images: ['existing1.jpg', 'existing2.jpg', 'existing3.jpg'],
		} as any)
		mockDb.recipe.update.mockResolvedValue({} as any)

		const { uploadRecipeImage } = await import('@/lib/s3')
		vi.mocked(uploadRecipeImage as any).mockResolvedValue('new-key.jpg')

		const result = await uploadRecipeImages(
			'recipe-1',
			makeFormData(makeFile('a.jpg')),
		)
		expect(result).toEqual({
			error: false,
			images: [
				'existing1.jpg',
				'existing2.jpg',
				'existing3.jpg',
				'new-key.jpg',
			],
		})
	})

	it('uploads images successfully', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue({ images: ['old.jpg'] } as any)
		mockDb.recipe.update.mockResolvedValue({} as any)

		const { uploadRecipeImage } = await import('@/lib/s3')
		vi.mocked(uploadRecipeImage as any).mockResolvedValue('new-key.jpg')

		const result = await uploadRecipeImages(
			'recipe-1',
			makeFormData(makeFile('a.jpg')),
		)
		expect(result).toEqual({
			error: false,
			images: ['old.jpg', 'new-key.jpg'],
		})
	})
})

describe('updateRecipeImages', () => {
	it('returns error when not authenticated', async () => {
		mockAuth.mockResolvedValue(null as any)

		const result = await updateRecipeImages('recipe-1', [])
		expect(result).toEqual({ error: true })
	})

	it('returns error when recipe not found or not owned', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue(null)

		const result = await updateRecipeImages('recipe-1', [])
		expect(result).toEqual({ error: true })
	})

	it('returns error when images exceed max count', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue({
			images: ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg'],
		} as any)

		const result = await updateRecipeImages('recipe-1', [
			'img1.jpg',
			'img2.jpg',
			'img3.jpg',
			'img4.jpg',
		])
		expect(result).toEqual({ error: true })
	})

	it('returns error when providing keys not belonging to recipe', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue({
			images: ['img1.jpg', 'img2.jpg'],
		} as any)

		const result = await updateRecipeImages('recipe-1', ['foreign-key.jpg'])
		expect(result).toEqual({ error: true })
	})

	it('reorders images without deleting', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue({
			images: ['img1.jpg', 'img2.jpg'],
		} as any)
		mockDb.recipe.update.mockResolvedValue({} as any)

		const result = await updateRecipeImages('recipe-1', [
			'img2.jpg',
			'img1.jpg',
		])
		expect(result).toEqual({ error: false })
		expect(mockDb.recipe.update).toHaveBeenCalledWith({
			where: { id: 'recipe-1', authorId: 'user-1' },
			data: { images: ['img2.jpg', 'img1.jpg'] },
		})
	})

	it('deletes removed images from S3', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findFirst.mockResolvedValue({
			images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
		} as any)
		mockDb.recipe.update.mockResolvedValue({} as any)

		const { deleteRecipeImages } = await import('@/lib/s3')
		vi.mocked(deleteRecipeImages).mockResolvedValue(undefined)

		const result = await updateRecipeImages('recipe-1', ['img1.jpg'])
		expect(result).toEqual({ error: false })
		expect(deleteRecipeImages).toHaveBeenCalledWith(['img2.jpg', 'img3.jpg'])
	})
})
