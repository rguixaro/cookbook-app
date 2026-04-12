// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/render'
import { FavouriteStatus } from './favourite'

vi.mock('@/server/actions', () => ({
	favouriteRecipe: vi.fn(),
}))

vi.mock('sonner', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}))

import { favouriteRecipe } from '@/server/actions'
import { toast } from 'sonner'

const mockFavouriteRecipe = vi.mocked(favouriteRecipe)

beforeEach(() => vi.clearAllMocks())

describe('FavouriteStatus', () => {
	it('renders a button', () => {
		renderWithProviders(<FavouriteStatus recipeId='r1' />)
		expect(screen.getByRole('button')).toBeInTheDocument()
	})

	it('calls favouriteRecipe and shows success toast on click', async () => {
		mockFavouriteRecipe.mockResolvedValue({ error: false })
		const user = userEvent.setup()

		renderWithProviders(<FavouriteStatus recipeId='r1' />)
		await user.click(screen.getByRole('button'))

		await waitFor(() => {
			expect(mockFavouriteRecipe).toHaveBeenCalledWith('r1', false)
		})
		expect(toast.success).toHaveBeenCalledWith('Recipe added to favourites')
	})

	it('reverts state and shows error toast on failure', async () => {
		mockFavouriteRecipe.mockRejectedValue(new Error('fail'))
		const user = userEvent.setup()

		renderWithProviders(<FavouriteStatus recipeId='r1' initial={false} />)
		await user.click(screen.getByRole('button'))

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('An error occurred')
		})
	})

	it('shows error toast when server returns error', async () => {
		mockFavouriteRecipe.mockResolvedValue({ error: true })
		const user = userEvent.setup()

		renderWithProviders(<FavouriteStatus recipeId='r1' />)
		await user.click(screen.getByRole('button'))

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('An error occurred')
		})
	})
})
