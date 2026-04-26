// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/render'
import { EditRecipe } from './edit'
import type { Recipe } from '@/types'

const routerMocks = vi.hoisted(() => ({
	replace: vi.fn(),
	refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
	useRouter: () => routerMocks,
}))

vi.mock('@/server/actions', () => ({
	updateRecipe: vi.fn(),
	uploadRecipeImages: vi.fn(),
	updateRecipeImages: vi.fn(),
	deleteRecipe: vi.fn(),
}))

vi.mock('sonner', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@sentry/nextjs', () => ({
	captureException: vi.fn(),
}))

import { deleteRecipe } from '@/server/actions'
import { toast } from 'sonner'

const mockDeleteRecipe = vi.mocked(deleteRecipe)

const recipe: Recipe = {
	id: 'recipe-1',
	slug: 'paella',
	name: 'Paella',
	time: 45,
	instructions: 'Cook the rice with stock until tender.',
	ingredients: ['rice', 'stock'],
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	updatedAt: new Date('2026-01-01T00:00:00.000Z'),
	category: 'Fish',
	authorId: 'user-1',
	authorUsername: 'testuser',
	images: [],
	sourceUrls: [],
}

beforeEach(() => {
	vi.clearAllMocks()
})

function renderEditRecipe() {
	return renderWithProviders(<EditRecipe recipe={recipe} />)
}

describe('EditRecipe delete flow', () => {
	it('renders a subtle delete trigger outside the edit form', () => {
		renderEditRecipe()

		expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument()
		const deleteTrigger = screen.getByRole('button', {
			name: 'Delete recipe',
		})

		expect(deleteTrigger).toBeInTheDocument()
		expect(deleteTrigger.closest('form')).toBeNull()
	})

	it('opens confirmation dialog and requires the confirmation word', async () => {
		const user = userEvent.setup()
		renderEditRecipe()

		await user.click(screen.getByRole('button', { name: 'Delete recipe' }))

		expect(screen.getByRole('dialog')).toBeInTheDocument()
		expect(screen.getAllByText('Delete recipe')).toHaveLength(2)

		const deleteButton = screen.getByRole('button', { name: /^Delete$/i })
		expect(deleteButton).toBeDisabled()

		await user.type(screen.getByPlaceholderText('delete'), 'delete')

		expect(deleteButton).not.toBeDisabled()
	})

	it('deletes the recipe, shows success, and redirects to the feed', async () => {
		mockDeleteRecipe.mockResolvedValue({ error: false })
		const user = userEvent.setup()
		renderEditRecipe()

		await user.click(screen.getByRole('button', { name: 'Delete recipe' }))
		await user.type(screen.getByPlaceholderText('delete'), 'delete')
		await user.click(screen.getByRole('button', { name: /^Delete$/i }))

		await waitFor(() => {
			expect(mockDeleteRecipe).toHaveBeenCalledWith('recipe-1')
		})
		expect(toast.success).toHaveBeenCalledWith('Recipe deleted successfully')
		expect(routerMocks.replace).toHaveBeenCalledWith('/')
		expect(routerMocks.refresh).toHaveBeenCalledOnce()
	})

	it('shows an error toast and stays on the form when deletion fails', async () => {
		mockDeleteRecipe.mockResolvedValue({ error: true })
		const user = userEvent.setup()
		renderEditRecipe()

		await user.click(screen.getByRole('button', { name: 'Delete recipe' }))
		await user.type(screen.getByPlaceholderText('delete'), 'delete')
		await user.click(screen.getByRole('button', { name: /^Delete$/i }))

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('An error occurred')
		})
		expect(routerMocks.replace).not.toHaveBeenCalled()
		expect(screen.getByRole('dialog')).toBeInTheDocument()
	})
})
