// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/render'
import { SavedStatus } from './saved'

vi.mock('@/server/actions', () => ({
	saveRecipe: vi.fn(),
}))

vi.mock('sonner', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}))

import { saveRecipe } from '@/server/actions'
import { toast } from 'sonner'

const mockSaveRecipe = vi.mocked(saveRecipe)

beforeEach(() => vi.clearAllMocks())

describe('SavedStatus', () => {
	it('renders a button', () => {
		renderWithProviders(<SavedStatus recipeId='r1' />)
		expect(screen.getByRole('button')).toBeInTheDocument()
	})

	it('calls saveRecipe and shows success toast on click', async () => {
		mockSaveRecipe.mockResolvedValue({ error: false })
		const user = userEvent.setup()

		renderWithProviders(<SavedStatus recipeId='r1' />)
		await user.click(screen.getByRole('button'))

		await waitFor(() => {
			expect(mockSaveRecipe).toHaveBeenCalledWith('r1', false)
		})
		expect(toast.success).toHaveBeenCalledWith('Recipe saved successfully')
	})

	it('reverts state and shows error toast on failure', async () => {
		mockSaveRecipe.mockRejectedValue(new Error('fail'))
		const user = userEvent.setup()

		renderWithProviders(<SavedStatus recipeId='r1' initial={false} />)
		await user.click(screen.getByRole('button'))

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('An error occurred')
		})
	})

	it('shows error toast when server returns error', async () => {
		mockSaveRecipe.mockResolvedValue({ error: true })
		const user = userEvent.setup()

		renderWithProviders(<SavedStatus recipeId='r1' />)
		await user.click(screen.getByRole('button'))

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('An error occurred')
		})
	})
})
