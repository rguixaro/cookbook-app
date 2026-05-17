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
			findUnique: vi.fn(),
			findMany: vi.fn(),
			delete: vi.fn(),
		},
		recipe: {
			findMany: vi.fn(),
		},
		recipeTranslation: {
			deleteMany: vi.fn(),
		},
	},
}))

vi.mock('next/cache', () => ({
	revalidatePath: vi.fn(),
}))

vi.mock('@/env.mjs', () => ({
	env: {
		MEDIA_MANAGEMENT_ENABLED: true,
	},
}))

vi.mock('@/lib/s3', () => ({
	deleteRecipeImages: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
	sendAccountDeletedEmail: vi.fn().mockResolvedValue(true),
}))

import { auth, signOut } from '@/auth'
import { env } from '@/env.mjs'
import { DEFAULT_SIGN_OUT_REDIRECT_URL } from '@/routes'
import { db } from '@/server/db'
import { sendAccountDeletedEmail } from '@/lib/email'
import { deleteRecipeImages } from '@/lib/s3'
import { updateProfile, deleteProfile } from './profile'

const mockAuth = vi.mocked(auth)
const mockDb = vi.mocked(db, true)
const mockEnv = env as { MEDIA_MANAGEMENT_ENABLED: boolean }

const mockSession = { user: { id: 'user-1' } }

beforeEach(() => {
	vi.clearAllMocks()
	mockEnv.MEDIA_MANAGEMENT_ENABLED = true
	mockDb.recipeTranslation.deleteMany.mockResolvedValue({ count: 0 } as any)
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
		mockDb.user.findUnique.mockResolvedValue({
			email: 'cook@example.com',
			name: 'Cook',
		} as any)
		mockDb.recipe.findMany.mockResolvedValue([])
		mockDb.user.findMany.mockResolvedValue([])
		mockDb.user.delete.mockResolvedValue({} as any)

		const result = await deleteProfile()
		expect(result).toBe(true)
		expect(mockDb.user.delete).toHaveBeenCalledWith({
			where: { id: 'user-1' },
		})
		expect(sendAccountDeletedEmail).toHaveBeenCalledWith({
			recipientEmail: 'cook@example.com',
			recipientName: 'Cook',
		})
		expect(signOut).toHaveBeenCalledWith({
			redirectTo: DEFAULT_SIGN_OUT_REDIRECT_URL,
		})
	})

	it('deletes profile and cleans up S3 images', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({
			email: 'cook@example.com',
			name: null,
		} as any)
		mockDb.recipe.findMany.mockResolvedValue([
			{ id: 'recipe-1', images: ['img1.jpg'] },
			{ id: 'recipe-2', images: ['img2.jpg', 'img3.jpg'] },
		] as any)
		mockDb.user.findMany.mockResolvedValue([])
		mockDb.user.delete.mockResolvedValue({} as any)
		vi.mocked(deleteRecipeImages).mockResolvedValue(undefined)

		const result = await deleteProfile()
		expect(result).toBe(true)
		expect(sendAccountDeletedEmail).toHaveBeenCalledWith({
			recipientEmail: 'cook@example.com',
			recipientName: 'cook@example.com',
		})
		expect(deleteRecipeImages).toHaveBeenCalledWith([
			'img1.jpg',
			'img2.jpg',
			'img3.jpg',
		])
		expect(mockDb.recipeTranslation.deleteMany).toHaveBeenCalledWith({
			where: { recipeId: { in: ['recipe-1', 'recipe-2'] } },
		})
		expect(
			mockDb.user.delete.mock.invocationCallOrder[0],
		).toBeLessThan(
			mockDb.recipeTranslation.deleteMany.mock.invocationCallOrder[0],
		)
	})

	it('deletes profile without S3 cleanup when media management is disabled', async () => {
		mockEnv.MEDIA_MANAGEMENT_ENABLED = false
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({
			email: 'cook@example.com',
			name: null,
		} as any)
		mockDb.recipe.findMany.mockResolvedValue([
			{ id: 'recipe-1', images: ['img1.jpg'] },
			{ id: 'recipe-2', images: ['img2.jpg', 'img3.jpg'] },
		] as any)
		mockDb.user.findMany.mockResolvedValue([])
		mockDb.user.delete.mockResolvedValue({} as any)

		const result = await deleteProfile()
		expect(result).toBe(true)
		expect(deleteRecipeImages).not.toHaveBeenCalled()
		expect(mockDb.user.delete).toHaveBeenCalledWith({
			where: { id: 'user-1' },
		})
	})

	it('returns null on database error', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({
			email: 'cook@example.com',
			name: 'Cook',
		} as any)
		mockDb.recipe.findMany.mockResolvedValue([])
		mockDb.user.findMany.mockResolvedValue([])
		mockDb.user.delete.mockRejectedValue(new Error('DB error'))

		const result = await deleteProfile()
		expect(result).toBeNull()
	})

	it('does not delete translations when profile deletion fails', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({
			email: 'cook@example.com',
			name: 'Cook',
		} as any)
		mockDb.recipe.findMany.mockResolvedValue([
			{ id: 'recipe-1', images: [] },
		] as any)
		mockDb.user.findMany.mockResolvedValue([])
		mockDb.user.delete.mockRejectedValue(new Error('DB error'))

		const result = await deleteProfile()

		expect(result).toBeNull()
		expect(mockDb.recipeTranslation.deleteMany).not.toHaveBeenCalled()
	})

	it('deletes profile when translation cleanup fails after user deletion', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({
			email: 'cook@example.com',
			name: 'Cook',
		} as any)
		mockDb.recipe.findMany.mockResolvedValue([
			{ id: 'recipe-1', images: [] },
		] as any)
		mockDb.user.findMany.mockResolvedValue([])
		mockDb.user.delete.mockResolvedValue({} as any)
		mockDb.recipeTranslation.deleteMany.mockRejectedValueOnce(
			new Error('cleanup failed'),
		)

		const result = await deleteProfile()

		expect(result).toBe(true)
		expect(mockDb.user.delete).toHaveBeenCalledWith({
			where: { id: 'user-1' },
		})
		expect(mockDb.recipeTranslation.deleteMany).toHaveBeenCalledWith({
			where: { recipeId: { in: ['recipe-1'] } },
		})
		expect(sendAccountDeletedEmail).toHaveBeenCalledWith({
			recipientEmail: 'cook@example.com',
			recipientName: 'Cook',
		})
		expect(signOut).toHaveBeenCalledWith({
			redirectTo: DEFAULT_SIGN_OUT_REDIRECT_URL,
		})
	})

	it('deletes profile when confirmation email fails', async () => {
		mockAuth.mockResolvedValue(mockSession as any)
		mockDb.user.findUnique.mockResolvedValue({
			email: 'cook@example.com',
			name: 'Cook',
		} as any)
		mockDb.recipe.findMany.mockResolvedValue([])
		mockDb.user.findMany.mockResolvedValue([])
		mockDb.user.delete.mockResolvedValue({} as any)
		vi.mocked(sendAccountDeletedEmail).mockRejectedValue(new Error('SES down'))

		const result = await deleteProfile()

		expect(result).toBe(true)
		expect(signOut).toHaveBeenCalledWith({
			redirectTo: DEFAULT_SIGN_OUT_REDIRECT_URL,
		})
	})
})
