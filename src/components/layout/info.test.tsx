// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '@/test/render'
import { Info } from './info'

vi.mock('motion/react', () => ({
	AnimatePresence: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('motion/react-client', () => ({
	div: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/recipes/add', () => ({
	AddRecipe: () => null,
}))

describe('Info', () => {
	it('renders the searched term in the recipe empty state', () => {
		renderWithProviders(<Info enabled mode='recipes' search='pasta' />)

		expect(screen.getByText('No recipes found for "pasta"')).toBeInTheDocument()
	})

	it('renders the searched term in the users empty state', () => {
		renderWithProviders(<Info enabled mode='profiles' search='qqweqweqq' />)

		expect(
			screen.getByText('No users found for "qqweqweqq"'),
		).toBeInTheDocument()
	})
})
