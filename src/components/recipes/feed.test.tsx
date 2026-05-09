// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/render'
import { RecipesFeed } from './feed'

const navigationState = vi.hoisted(() => ({ pathname: '/', query: '' }))
const animatePresenceProps = vi.hoisted(
	() => [] as Array<{ mode?: string; initial?: boolean }>,
)
const motionDivProps = vi.hoisted(
	() => [] as Array<{ className?: string; initial?: unknown }>,
)
const infoProps = vi.hoisted(
	() => [] as Array<{ enabled: boolean; mode: string; search?: string }>,
)

vi.mock('@/server/actions', () => ({
	fetchRecipes: vi.fn(),
}))

vi.mock('@/hooks', () => ({
	useInfiniteScroll: () => ({ current: null }),
}))

vi.mock('@/components/recipes/item', () => ({
	ItemRecipe: ({ recipe }: { recipe: { name: string } }) => (
		<div data-testid='recipe-item'>{recipe.name}</div>
	),
}))

vi.mock('next/navigation', () => ({
	usePathname: () => navigationState.pathname,
	useSearchParams: () => new URLSearchParams(navigationState.query),
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
			initial,
		}: {
			children: ReactNode
			className?: string
			initial?: unknown
		}) => {
			motionDivProps.push({ className, initial })
			return <div className={className}>{children}</div>
		},
	},
}))

vi.mock('@/components/layout', () => ({
	Info: ({
		enabled,
		mode,
		search,
	}: {
		enabled: boolean
		mode: string
		search?: string
	}) => {
		infoProps.push({ enabled, mode, search })
		return enabled && mode === 'recipes' ? (
			<div>
				{search ? `No recipes found for "${search}"` : 'No recipes found'}
			</div>
		) : null
	},
}))

import { fetchRecipes } from '@/server/actions'
import type { RecipeSchema } from '@/server/schemas'

const mockFetchRecipes = vi.mocked(fetchRecipes)

beforeEach(() => {
	vi.clearAllMocks()
	animatePresenceProps.length = 0
	motionDivProps.length = 0
	infoProps.length = 0
	navigationState.pathname = '/'
	navigationState.query = ''
})

function makeRecipe(overrides: Partial<RecipeSchema> = {}): RecipeSchema {
	return {
		id: '1',
		name: 'Pasta Carbonara',
		slug: 'pasta-carbonara',
		course: 'FirstCourse',
		categories: ['Pasta'],
		time: 30,
		ingredients: ['pasta', 'egg', 'bacon'],
		complements: [],
		instructions: 'Cook the pasta...',
		images: [],
		sourceUrls: [],
		authorId: 'user-1',
		authorUsername: 'chef',
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
		...overrides,
	}
}

describe('RecipesFeed', () => {
	it('shows skeletons while loading the first page', () => {
		mockFetchRecipes.mockImplementation(() => new Promise(() => {}))
		renderWithProviders(<RecipesFeed />)

		const skeletons = document.querySelectorAll('.animate-pulse')
		expect(skeletons.length).toBeGreaterThan(0)
	})

	it('uses a waited animation boundary for the primary feed state', () => {
		mockFetchRecipes.mockImplementation(() => new Promise(() => {}))
		renderWithProviders(<RecipesFeed />)

		expect(animatePresenceProps).toContainEqual({
			mode: 'wait',
			initial: false,
		})
	})

	it('shows a spinner in the count chip while the first page is loading', () => {
		mockFetchRecipes.mockImplementation(() => new Promise(() => {}))
		renderWithProviders(<RecipesFeed />)

		expect(screen.queryByText('0 recipes')).not.toBeInTheDocument()
		expect(
			screen.getByRole('status', { name: 'Searching recipes...' }),
		).toBeInTheDocument()
		expect(
			screen.getByText('1 recipe', { selector: '[aria-hidden="true"]' }),
		).toHaveClass('invisible')
	})

	it('renders recipes after fetch', async () => {
		mockFetchRecipes.mockResolvedValue({
			recipes: [makeRecipe()],
			nextCursor: null,
			totalCount: 1,
		})

		renderWithProviders(<RecipesFeed />)

		await waitFor(() => {
			expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument()
		})
		expect(infoProps).toContainEqual(
			expect.objectContaining({ enabled: false, mode: 'recipes' }),
		)
	})

	it('renders the search result count when searching recipes', async () => {
		mockFetchRecipes.mockResolvedValue({
			recipes: [makeRecipe()],
			nextCursor: null,
			totalCount: 12,
		})

		renderWithProviders(<RecipesFeed searchParam='pasta' />)

		await waitFor(() => {
			expect(screen.getByText('12 recipes')).toBeInTheDocument()
		})
	})

	it('uses the total result count instead of the loaded page count', async () => {
		mockFetchRecipes.mockResolvedValue({
			recipes: Array.from({ length: 10 }, (_, i) =>
				makeRecipe({ id: `recipe-${i}` }),
			),
			nextCursor: 'recipe-9',
			totalCount: 37,
		})

		renderWithProviders(<RecipesFeed searchParam='pasta' />)

		await waitFor(() => {
			expect(screen.getByText('37 recipes')).toBeInTheDocument()
		})
	})

	it('renders the result count when filtering recipes', async () => {
		mockFetchRecipes.mockResolvedValue({
			recipes: [makeRecipe()],
			nextCursor: null,
			totalCount: 5,
		})

		renderWithProviders(<RecipesFeed courseParam='FirstCourse' />)

		await waitFor(() => {
			expect(screen.getByText('5 recipes')).toBeInTheDocument()
		})
	})

	it('renders the searched term when recipe search has no results', async () => {
		mockFetchRecipes.mockResolvedValue({
			recipes: [],
			nextCursor: null,
			totalCount: 0,
		})

		renderWithProviders(<RecipesFeed searchParam='missing' />)

		await waitFor(() => {
			expect(
				screen.getByText('No recipes found for "missing"'),
			).toBeInTheDocument()
		})
		expect(screen.getByRole('link', { name: 'Clear search' })).toHaveAttribute(
			'href',
			'/',
		)
		expect(screen.getByRole('link', { name: 'New recipe' })).toHaveAttribute(
			'href',
			'/recipes/new',
		)
		expect(
			infoProps.some(
				(props) => props.enabled === false && props.mode === 'recipes',
			),
		).toBe(false)
		expect(screen.getByText('0 recipes')).toBeInTheDocument()
	})

	it('uses the no-results component when filters have no results', async () => {
		navigationState.query = 'course=FirstCourse'
		mockFetchRecipes.mockResolvedValue({
			recipes: [],
			nextCursor: null,
			totalCount: 0,
		})

		renderWithProviders(<RecipesFeed courseParam='FirstCourse' />)

		await waitFor(() => {
			expect(screen.getByText('No recipes found')).toBeInTheDocument()
		})
		expect(screen.getByRole('link', { name: 'Clear filters' })).toHaveAttribute(
			'href',
			'/',
		)
		expect(screen.getByRole('link', { name: 'New recipe' })).toHaveAttribute(
			'href',
			'/recipes/new',
		)
		expect(
			infoProps.some(
				(props) => props.enabled === false && props.mode === 'recipes',
			),
		).toBe(false)
		expect(motionDivProps).toContainEqual(
			expect.objectContaining({
				className: 'flex w-full flex-col items-center',
				initial: { opacity: 0, y: -18, scale: 0.98 },
			}),
		)
	})

	it('uses a clear-all action when search and filters have no results', async () => {
		navigationState.query = 'search=missing&course=FirstCourse'
		mockFetchRecipes.mockResolvedValue({
			recipes: [],
			nextCursor: null,
			totalCount: 0,
		})

		renderWithProviders(
			<RecipesFeed searchParam='missing' courseParam='FirstCourse' />,
		)

		await waitFor(() => {
			expect(
				screen.getByText('No recipes found for "missing"'),
			).toBeInTheDocument()
		})
		expect(screen.getByRole('link', { name: 'Clear all' })).toHaveAttribute(
			'href',
			'/',
		)
	})

	it('renders the search result count for user recipe search', async () => {
		mockFetchRecipes.mockResolvedValue({
			recipes: [makeRecipe()],
			nextCursor: null,
			totalCount: 1,
		})

		renderWithProviders(
			<RecipesFeed referred userId='user-2' searchParam='pasta' />,
		)

		await waitFor(() => {
			expect(screen.getByText('1 recipe')).toBeInTheDocument()
		})
		expect(
			infoProps.some(
				(props) => props.enabled === false && props.mode === 'recipes',
			),
		).toBe(false)
		expect(mockFetchRecipes).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: 'user-2',
				search: 'pasta',
			}),
		)
	})

	it('renders the result count when filtering user recipes', async () => {
		mockFetchRecipes.mockResolvedValue({
			recipes: [makeRecipe()],
			nextCursor: null,
			totalCount: 8,
		})

		renderWithProviders(<RecipesFeed referred userId='user-2' savedParam />)

		await waitFor(() => {
			expect(screen.getByText('8 recipes')).toBeInTheDocument()
		})
	})

	it('renders the searched term in the user recipe empty state', async () => {
		navigationState.pathname = '/profiles/chef'
		navigationState.query = 'search=missing&saved=true'
		mockFetchRecipes.mockResolvedValue({
			recipes: [],
			nextCursor: null,
			totalCount: 0,
		})

		renderWithProviders(
			<RecipesFeed referred userId='user-2' searchParam='missing' />,
		)

		await waitFor(() => {
			expect(
				screen.getByText('No recipes found for "missing"'),
			).toBeInTheDocument()
		})
		expect(screen.getByRole('link', { name: 'Clear all' })).toHaveAttribute(
			'href',
			'/profiles/chef',
		)
		expect(
			screen.queryByRole('link', { name: 'New recipe' }),
		).not.toBeInTheDocument()
		expect(screen.getByText('0 recipes')).toBeInTheDocument()
	})

	it('keeps the users search param when clearing profile recipe search and filters', async () => {
		navigationState.pathname = '/profiles/chef'
		navigationState.query = 'search=olg&recipeSearch=missing&saved=true'
		mockFetchRecipes.mockResolvedValue({
			recipes: [],
			nextCursor: null,
			totalCount: 0,
		})

		renderWithProviders(
			<RecipesFeed
				referred
				userId='user-2'
				searchParam='missing'
				searchParamName='recipeSearch'
				savedParam
			/>,
		)

		await waitFor(() => {
			expect(
				screen.getByText('No recipes found for "missing"'),
			).toBeInTheDocument()
		})
		expect(screen.getByRole('link', { name: 'Clear all' })).toHaveAttribute(
			'href',
			'/profiles/chef?search=olg',
		)
	})

	it('passes saved filter through to fetchRecipes', async () => {
		mockFetchRecipes.mockResolvedValue({
			recipes: [],
			nextCursor: null,
			totalCount: 0,
		})

		renderWithProviders(<RecipesFeed userId='user-2' savedParam />)

		await waitFor(() => {
			expect(mockFetchRecipes).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: 'user-2',
					saved: true,
				}),
			)
		})
	})

	it('prompts recipe creation when the dashboard has no recipes yet', async () => {
		mockFetchRecipes.mockResolvedValue({
			recipes: [],
			nextCursor: null,
			totalCount: 0,
		})

		renderWithProviders(<RecipesFeed />)

		await waitFor(() => {
			expect(screen.getByText('Create your first recipe')).toBeInTheDocument()
		})
		expect(screen.queryByText('No recipes found')).not.toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'New recipe' })).toHaveAttribute(
			'href',
			'/recipes/new',
		)
		expect(
			infoProps.some(
				(props) => props.enabled === false && props.mode === 'recipes',
			),
		).toBe(false)
	})

	it('deduplicates recipes across pages', async () => {
		const recipe = makeRecipe()

		mockFetchRecipes.mockResolvedValue({
			recipes: [recipe, recipe],
			nextCursor: null,
			totalCount: 1,
		})

		renderWithProviders(<RecipesFeed />)

		await waitFor(() => {
			const items = screen.getAllByTestId('recipe-item')
			expect(items).toHaveLength(1)
		})
	})
})
