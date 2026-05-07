// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '@/test/render'
import type { ProfileSchema } from '@/server/schemas'
import { ProfilesResults } from './results'

const animatePresenceProps = vi.hoisted(() => [] as Array<unknown>)

vi.mock('motion/react', () => ({
	AnimatePresence: ({
		children,
		mode,
		initial,
	}: {
		children: ReactNode
		mode?: string
		initial?: boolean
	}) => {
		animatePresenceProps.push({ mode, initial })
		return children
	},
	motion: {
		div: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	},
}))

function makeProfile(overrides: Partial<ProfileSchema> = {}): ProfileSchema {
	return {
		id: 'user-1',
		name: 'Chef Ana',
		username: 'chefana',
		image: 'https://lh3.googleusercontent.com/avatar.jpg',
		recipesCount: 3,
		latestRecipe: null,
		...overrides,
	}
}

describe('ProfilesResults', () => {
	it('renders the initial prompt when there is no search', () => {
		renderWithProviders(<ProfilesResults profiles={[]} />)

		expect(
			screen.getByText('Search users to see their recipes'),
		).toBeInTheDocument()
		expect(screen.queryByText('1 user')).not.toBeInTheDocument()
	})

	it('renders the no-results message and clear action for an empty search result', () => {
		renderWithProviders(
			<ProfilesResults profiles={[]} searchParam='qqweqweqq' />,
		)

		expect(
			screen.getByText('No users found for "qqweqweqq"'),
		).toBeInTheDocument()
		expect(screen.getByText('0 users')).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'Clear search' })).toHaveAttribute(
			'href',
			'/profiles',
		)
	})

	it('renders the count and list in the same waited animation slot', () => {
		const { rerender } = renderWithProviders(<ProfilesResults profiles={[]} />)

		rerender(
			<ProfilesResults
				profiles={[makeProfile()]}
				searchParam='chef'
			/>,
		)

		expect(
			screen.queryByText('Search users to see their recipes'),
		).not.toBeInTheDocument()
		expect(screen.getByText('1 user')).toBeInTheDocument()
		expect(screen.getByText('@Chef Ana')).toBeInTheDocument()
		expect(animatePresenceProps.at(-1)).toMatchObject({
			mode: 'wait',
			initial: false,
		})
	})
})
