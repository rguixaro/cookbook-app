// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '@/test/render'
import {
	ProfilesNoResults,
	ProfilesSearchFeedback,
	ProfilesSearchPrompt,
} from './no-results'

vi.mock('motion/react', () => ({
	AnimatePresence: ({ children }: { children: ReactNode }) => children,
	motion: {
		div: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	},
}))

describe('ProfilesNoResults', () => {
	it('renders the clear search link underneath the no-results text', () => {
		renderWithProviders(
			<ProfilesNoResults visible search='qqweqweqq' />,
		)

		const message = screen.getByText('No users found for "qqweqweqq"')
		const clearLink = screen.getByRole('link', { name: 'Clear search' })

		expect(clearLink).toHaveAttribute('href', '/profiles')
		expect(
			message.compareDocumentPosition(clearLink) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy()
	})

	it('does not render when hidden', () => {
		renderWithProviders(
			<ProfilesNoResults visible={false} search='qqweqweqq' />,
		)

		expect(
			screen.queryByText('No users found for "qqweqweqq"'),
		).not.toBeInTheDocument()
	})

	it('renders the initial search prompt without the no-results action', () => {
		renderWithProviders(<ProfilesSearchPrompt visible />)

		expect(
			screen.getByText('Search users to see their recipes'),
		).toBeInTheDocument()
		expect(
			screen.queryByRole('link', { name: 'Clear search' }),
		).not.toBeInTheDocument()
	})

	it('switches between prompt and no-results states in one feedback slot', () => {
		const { rerender } = renderWithProviders(
			<ProfilesSearchFeedback state='prompt' search='' />,
		)

		expect(
			screen.getByText('Search users to see their recipes'),
		).toBeInTheDocument()

		rerender(
			<ProfilesSearchFeedback state='no-results' search='qqweqweqq' />,
		)

		expect(
			screen.queryByText('Search users to see their recipes'),
		).not.toBeInTheDocument()
		expect(
			screen.getByText('No users found for "qqweqweqq"'),
		).toBeInTheDocument()
	})
})
