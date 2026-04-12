/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
	auth: vi.fn(),
	signOut: vi.fn(),
	unstable_update: vi.fn(),
}))

vi.mock('@/server/db', () => ({
	db: {
		user: {
			update: vi.fn(),
			findMany: vi.fn(),
			delete: vi.fn(),
		},
		recipe: {
			findMany: vi.fn(),
		},
	},
}))

vi.mock('next/cache', () => ({
	revalidatePath: vi.fn(),
}))

vi.mock('@/lib/s3', () => ({
	deleteRecipeImages: vi.fn(),
}))

import { auth, signOut } from '@/auth'
import { db } from '@/server/db'
import { deleteRecipeImages } from '@/lib/s3'
import { updateProfile, deleteProfile } from './profile'

const mockAuth = vi.mocked(auth)
const mockDb = vi.mocked(db, true)

const mockSession = { user: { id: 'user-1' } }

beforeEach(() => {
	vi.clearAllMocks()
})

describe('updateProfile', () => {
	it('returns null when not authenticated', async () => {
		mockAuth.mockResolvedValue(null as any)

		const result = await updateProfile({ name: 'John' })
		expect(result).toBeNull()
	})

	it('returns null for invalid input', async () => {
		mockAuth.mockResolvedValue(mockSession as any)

		const result = await updateProfile({ name: '' })
		expect(result).toBeNull()
	})

	it('updates profile successfully', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.update.mockResolvedValue({} as any)

		const result = await updateProfile({ name: 'John', isPrivate: true })
		expect(result).toBeUndefined()
		expect(mockDb.user.update).toHaveBeenCalledWith({
			where: { id: 'user-1' },
			data: { name: 'John', isPrivate: true },
		})
	})

	it('returns null on database error', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.update.mockRejectedValue(new Error('DB error'))

		const result = await updateProfile({ name: 'John' })
		expect(result).toBeNull()
	})
})

describe('deleteProfile', () => {
	it('returns null when not authenticated', async () => {
		mockAuth.mockResolvedValue(null as any)

		const result = await deleteProfile()
		expect(result).toBeNull()
	})

	it('deletes profile with no recipe images', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findMany.mockResolvedValue([])
		mockDb.user.findMany.mockResolvedValue([])
		mockDb.user.delete.mockResolvedValue({} as any)

		const result = await deleteProfile()
		expect(result).toBe(true)
		expect(mockDb.user.delete).toHaveBeenCalledWith({
			where: { id: 'user-1' },
		})
		expect(signOut).toHaveBeenCalled()
	})

	it('deletes profile and cleans up S3 images', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findMany.mockResolvedValue([
			{ id: 'recipe-1', images: ['img1.jpg'] },
			{ id: 'recipe-2', images: ['img2.jpg', 'img3.jpg'] },
		] as any)
		mockDb.user.findMany.mockResolvedValue([])
		mockDb.user.delete.mockResolvedValue({} as any)
		vi.mocked(deleteRecipeImages).mockResolvedValue(undefined)

		const result = await deleteProfile()
		expect(result).toBe(true)
		expect(deleteRecipeImages).toHaveBeenCalledWith([
			'img1.jpg',
			'img2.jpg',
			'img3.jpg',
		])
	})

	it('returns null on database error', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.recipe.findMany.mockResolvedValue([])
		mockDb.user.findMany.mockResolvedValue([])
		mockDb.user.delete.mockRejectedValue(new Error('DB error'))

		const result = await deleteProfile()
		expect(result).toBeNull()
	})
})
