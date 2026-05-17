// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '@/test/render'
import type { ProfileSchema } from '@/server/schemas'
import { ItemProfile } from './item'

const cookieState = vi.hoisted(() => ({ ready: true }))

vi.mock('@/providers/cookie-provider', () => ({
	useCookiesReady: () => cookieState.ready,
}))

vi.mock('motion/react', () => ({
	motion: {
		div: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	},
}))

vi.mock('next/image', () => ({
	default: ({
		src,
		alt,
		loader,
		onLoad,
		onError,
	}: {
		src: string
		alt: string
		loader?: (args: { src: string; width: number; quality?: number }) => string
		onLoad?: () => void
		onError?: () => void
	}) => (
		<img
			src={loader ? loader({ src, width: 96 }) : src}
			alt={alt}
			onLoad={onLoad}
			onError={onError}
		/>
	),
}))

function makeProfile(overrides: Partial<ProfileSchema> = {}): ProfileSchema {
	return {
		id: 'user-1',
		name: 'Chef Ana',
		username: 'chefana',
		image: 'https://lh3.googleusercontent.com/avatar.jpg',
		recipesCount: 3,
		latestRecipe: {
			name: 'Fresh Pasta',
			slug: 'fresh-pasta',
			time: 30,
			course: 'first_course',
			categories: ['pasta'],
			image: 'https://assets.example.com/pasta.jpg',
		},
		...overrides,
	}
}

describe('ItemProfile', () => {
	it('does not render the user profile image in list items', () => {
		renderWithProviders(<ItemProfile profile={makeProfile()} />)

		expect(
			screen.queryByRole('img', { name: 'Profile image' }),
		).not.toBeInTheDocument()
	})

	it('preserves the profiles search param in the profile link', () => {
		renderWithProviders(
			<ItemProfile profile={makeProfile()} query='chef ana' />,
		)

		expect(screen.getByRole('link')).toHaveAttribute(
			'href',
			'/profiles/chefana?search=chef%20ana',
		)
	})

	it('shows the latest recipe preview when available', () => {
		renderWithProviders(<ItemProfile profile={makeProfile()} />)

		expect(screen.getByText('Latest recipe')).toBeInTheDocument()
		expect(screen.getByText('Fresh Pasta')).toBeInTheDocument()
		expect(screen.getByText("30'")).toBeInTheDocument()
		expect(screen.getByText('First course')).toBeInTheDocument()
		expect(screen.getByText('Pasta')).toBeInTheDocument()
		expect(screen.getByRole('img', { name: 'Fresh Pasta' })).toHaveAttribute(
			'src',
			expect.stringContaining('/api/proxy?url='),
		)
	})

	it('shows latest recipe chips without an image rail when no image is available', () => {
		renderWithProviders(
			<ItemProfile
				profile={makeProfile({
					latestRecipe: {
						name: 'Fresh Pasta',
						slug: 'fresh-pasta',
						time: 30,
						course: 'first_course',
						categories: ['pasta'],
						image: null,
					},
				})}
			/>,
		)

		expect(screen.getByText('Fresh Pasta')).toBeInTheDocument()
		expect(screen.getByText("30'")).toBeInTheDocument()
		expect(screen.queryByRole('img', { name: 'Fresh Pasta' })).not.toBeInTheDocument()
	})

	it('omits the latest recipe preview when unavailable', () => {
		renderWithProviders(
			<ItemProfile profile={makeProfile({ latestRecipe: null })} />,
		)

		expect(screen.queryByText('Latest recipe')).not.toBeInTheDocument()
	})
})
