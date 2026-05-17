// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'

import { renderWithProviders } from '@/test/render'
import { ShowcaseRecipesFeed } from './showcase-feed'

const animatePresenceProps = vi.hoisted(
	() => [] as Array<{ mode?: string; initial?: boolean }>,
)
const infiniteScrollState = vi.hoisted(() => ({
	callback: null as null | (() => void),
	enabled: false,
}))

vi.mock('@/server/actions', () => ({
	fetchRecipes: vi.fn(),
	fetchShowcaseRecipes: vi.fn(),
}))

vi.mock('@/hooks', () => ({
	useInfiniteScroll: (callback: () => void, enabled: boolean) => {
		infiniteScrollState.callback = callback
		infiniteScrollState.enabled = enabled
		return { current: null }
	},
}))

vi.mock('@/components/recipes/item', () => ({
	ItemRecipe: ({ recipe }: { recipe: { name: string } }) => (
		<div data-testid='recipe-item'>{recipe.name}</div>
	),
}))

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
		div: ({
			children,
			className,
		}: {
			children: ReactNode
			className?: string
		}) => <div className={className}>{children}</div>,
	},
}))

import { fetchShowcaseRecipes } from '@/server/actions'
import type { RecipeSchema } from '@/server/schemas'

const mockFetchShowcaseRecipes = vi.mocked(fetchShowcaseRecipes)

beforeEach(() => {
	vi.clearAllMocks()
	animatePresenceProps.length = 0
	infiniteScrollState.callback = null
	infiniteScrollState.enabled = false
})

function makeRecipe(overrides: Partial<RecipeSchema> = {}): RecipeSchema {
	const base: RecipeSchema = {
		id: 'showcase-1',
		name: 'Spanish Potato Omelette',
		slug: 'spanish-potato-omelette',
		course: 'second_course',
		categories: ['vegetable'],
		time: 45,
		ingredients: ['eggs', 'potatoes'],
		complements: [],
		instructions: 'Cook slowly.',
		images: [],
		sourceUrls: [],
		authorId: null,
		authorUsername: '',
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
		visibility: 'showcase',
		locale: 'en',
	}

	return {
		...base,
		...overrides,
		visibility: overrides.visibility ?? base.visibility,
		locale: overrides.locale ?? base.locale,
	}
}

describe('ShowcaseRecipesFeed', () => {
	it('uses the same skeleton card loading style as the normal feed', () => {
		mockFetchShowcaseRecipes.mockImplementation(() => new Promise(() => {}))

		renderWithProviders(<ShowcaseRecipesFeed take={3} />)

		expect(screen.getByText('Suggested recipes')).toBeInTheDocument()
		expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3)
	})

	it('uses a waited animation boundary for showcase state changes', () => {
		mockFetchShowcaseRecipes.mockImplementation(() => new Promise(() => {}))

		renderWithProviders(<ShowcaseRecipesFeed />)

		expect(animatePresenceProps).toContainEqual({
			mode: 'wait',
			initial: false,
		})
	})

	it('renders fetched showcase recipes with the shared recipe item', async () => {
		mockFetchShowcaseRecipes.mockResolvedValue({
			recipes: [makeRecipe()],
			nextCursor: null,
			totalCount: 1,
		})

		renderWithProviders(<ShowcaseRecipesFeed />)

		await waitFor(() => {
			expect(screen.getByText('Spanish Potato Omelette')).toBeInTheDocument()
		})
		expect(screen.getByRole('link', { name: 'See more' })).toHaveAttribute(
			'href',
			'/discover',
		)
	})

	it('passes discover filters to the showcase fetch action', async () => {
		mockFetchShowcaseRecipes.mockResolvedValue({
			recipes: [makeRecipe()],
			nextCursor: null,
			totalCount: 1,
		})

		renderWithProviders(
			<ShowcaseRecipesFeed
				searchParam='pasta'
				courseParam='first_course'
				categoriesParam='pasta'
				sortParam='timeAsc'
				take={10}
				showHeader={false}
				showResultCount
				showEmptyState
				enableInfiniteScroll
			/>,
		)

		await waitFor(() => {
			expect(mockFetchShowcaseRecipes).toHaveBeenCalledWith(
				expect.objectContaining({
					search: 'pasta',
					course: 'first_course',
					categories: 'pasta',
					sort: 'timeAsc',
					take: 10,
				}),
			)
		})
		expect(screen.getByText('1 recipe')).toBeInTheDocument()
		expect(screen.queryByText('Suggested recipes')).not.toBeInTheDocument()
	})

	it('does not start duplicate next-page fetches while one is in flight', async () => {
		let resolveNextPage: (
			value: Awaited<ReturnType<typeof fetchShowcaseRecipes>>,
		) => void = () => {}
		const nextPage = new Promise<
			Awaited<ReturnType<typeof fetchShowcaseRecipes>>
		>((resolve) => {
			resolveNextPage = resolve
		})

		mockFetchShowcaseRecipes
			.mockResolvedValueOnce({
				recipes: Array.from({ length: 10 }, (_, index) =>
					makeRecipe({
						id: `showcase-${index}`,
						name: `Showcase Recipe ${index}`,
					}),
				),
				nextCursor: 'showcase-9',
				totalCount: 12,
			})
			.mockReturnValueOnce(nextPage)

		renderWithProviders(
			<ShowcaseRecipesFeed
				take={10}
				showHeader={false}
				showResultCount
				showEmptyState
				enableInfiniteScroll
			/>,
		)

		await waitFor(() => {
			expect(screen.getByText('Showcase Recipe 9')).toBeInTheDocument()
		})
		expect(infiniteScrollState.enabled).toBe(true)

		act(() => {
			infiniteScrollState.callback?.()
			infiniteScrollState.callback?.()
		})

		await waitFor(() => {
			expect(mockFetchShowcaseRecipes).toHaveBeenCalledTimes(2)
		})
		expect(mockFetchShowcaseRecipes).toHaveBeenLastCalledWith(
			expect.objectContaining({ cursor: 'showcase-9' }),
		)

		await act(async () => {
			resolveNextPage({
				recipes: [
					makeRecipe({
						id: 'showcase-10',
						name: 'Showcase Recipe 10',
					}),
				],
				nextCursor: null,
				totalCount: 12,
			})
			await nextPage
		})

		await waitFor(() => {
			expect(screen.getByText('Showcase Recipe 10')).toBeInTheDocument()
		})
		expect(mockFetchShowcaseRecipes).toHaveBeenCalledTimes(2)
	})
})
