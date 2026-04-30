// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/render'
import { RecipesFeed } from './feed'

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

vi.mock('@/components/layout', () => ({
	Info: ({ enabled, mode }: { enabled: boolean; mode: string }) =>
		enabled && mode === 'recipes' ? <div>No recipes found</div> : null,
}))

import { fetchRecipes } from '@/server/actions'
import type { RecipeSchema } from '@/server/schemas'

const mockFetchRecipes = vi.mocked(fetchRecipes)

beforeEach(() => vi.clearAllMocks())

function makeRecipe(overrides: Partial<RecipeSchema> = {}): RecipeSchema {
	return {
		id: '1',
		name: 'Pasta Carbonara',
		slug: 'pasta-carbonara',
		course: 'FirstCourse',
		categories: ['Pasta'],
		time: 30,
		ingredients: ['pasta', 'egg', 'bacon'],
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
	it('shows skeletons while loading', () => {
		mockFetchRecipes.mockImplementation(() => new Promise(() => {}))
		renderWithProviders(<RecipesFeed />)

		const skeletons = document.querySelectorAll('.animate-pulse')
		expect(skeletons.length).toBeGreaterThan(0)
	})

	it('renders recipes after fetch', async () => {
		mockFetchRecipes.mockResolvedValue({
			recipes: [makeRecipe()],
			nextCursor: null,
		})

		renderWithProviders(<RecipesFeed />)

		await waitFor(() => {
			expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument()
		})
	})

	it('passes saved filter through to fetchRecipes', async () => {
		mockFetchRecipes.mockResolvedValue({
			recipes: [],
			nextCursor: null,
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

	it('shows empty state when no recipes found', async () => {
		mockFetchRecipes.mockResolvedValue({
			recipes: [],
			nextCursor: null,
		})

		renderWithProviders(<RecipesFeed />)

		await waitFor(() => {
			expect(screen.getByText('No recipes found')).toBeInTheDocument()
		})
	})

	it('deduplicates recipes across pages', async () => {
		const recipe = makeRecipe()

		mockFetchRecipes.mockResolvedValue({
			recipes: [recipe, recipe],
			nextCursor: null,
		})

		renderWithProviders(<RecipesFeed />)

		await waitFor(() => {
			const items = screen.getAllByTestId('recipe-item')
			expect(items).toHaveLength(1)
		})
	})
})
