// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders, userEvent } from '@/test/render'
import { RecipeInfo } from './info'

describe('RecipeInfo', () => {
	it('opens a dialog with recipe stats', async () => {
		const user = userEvent.setup()
		renderWithProviders(
			<RecipeInfo
				isOwner
				createdAt='Jan 1, 2026'
				updatedAt='Jan 2, 2026'
				savedCount={2}
				favouriteCount={1}
			/>,
		)

		await user.click(screen.getByRole('button', { name: 'Recipe details' }))

		const dialog = screen.getByRole('dialog')
		expect(dialog).toBeInTheDocument()
		expect(dialog).toHaveClass('recipe-info-sheet')
		expect(dialog).toHaveClass('bottom-0')
		expect(dialog).toHaveClass('sm:top-[50%]')
		expect(
			screen.getByRole('button', { name: 'Close recipe details' }),
		).toBeInTheDocument()
		expect(screen.getByText('Created')).toBeInTheDocument()
		expect(screen.getByText('Jan 1, 2026')).toBeInTheDocument()
		expect(screen.getByText('Latest edit')).toBeInTheDocument()
		expect(screen.getByText('Jan 2, 2026')).toBeInTheDocument()
		expect(screen.getByText('2 saves')).toBeInTheDocument()
		expect(screen.getByText('1 favourite')).toBeInTheDocument()
	})

	it('only shows the creation date for recipes owned by someone else', async () => {
		const user = userEvent.setup()
		renderWithProviders(
			<RecipeInfo
				createdAt='Jan 1, 2026'
				updatedAt='Jan 2, 2026'
				savedCount={2}
				favouriteCount={1}
			/>,
		)

		await user.click(screen.getByRole('button', { name: 'Recipe details' }))

		expect(screen.getByText('Created')).toBeInTheDocument()
		expect(screen.getByText('Jan 1, 2026')).toBeInTheDocument()
		expect(screen.queryByText('Latest edit')).not.toBeInTheDocument()
		expect(screen.queryByText('Jan 2, 2026')).not.toBeInTheDocument()
		expect(screen.queryByText('2 saves')).not.toBeInTheDocument()
		expect(screen.queryByText('1 favourite')).not.toBeInTheDocument()
	})
})
