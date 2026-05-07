// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/render'
import { SearchRecipes } from './search'

const navigationState = vi.hoisted(() => ({ query: '' }))
const mockReplace = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
	useSearchParams: () => new URLSearchParams(navigationState.query),
	usePathname: () => '/',
	useRouter: () => ({ replace: mockReplace }),
}))

vi.mock('motion/react', () => ({
	AnimatePresence: ({ children }: any) => children,
}))

vi.mock('motion/react-client', () => ({
	div: ({ children, ...props }: any) => {
		const safe = Object.fromEntries(
			Object.entries(props).filter(
				([k]) =>
					!k.startsWith('initial') &&
					!k.startsWith('while') &&
					k !== 'animate' &&
					k !== 'exit',
			),
		)
		return <div {...safe}>{children}</div>
	},
}))

vi.mock('use-debounce', () => ({
	useDebouncedCallback: (fn: Function) => fn,
}))

beforeEach(() => {
	vi.clearAllMocks()
	navigationState.query = ''
})

describe('SearchRecipes', () => {
	it('renders the search input and filters/favourites buttons', () => {
		renderWithProviders(<SearchRecipes withAvatar={false} />)

		expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
		expect(screen.getByText('Filters')).toBeInTheDocument()
		expect(screen.getByText('Favourites')).toBeInTheDocument()
	})

	it('updates URL when typing in search', async () => {
		const user = userEvent.setup()
		renderWithProviders(<SearchRecipes withAvatar={false} />)

		const input = screen.getByPlaceholderText('Search')
		await user.type(input, 'pasta')

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalled()
			const lastCall =
				mockReplace.mock.calls[mockReplace.mock.calls.length - 1][0]
			expect(lastCall).toContain('search=')
		})
	})

	it('can use a separate URL param for profile recipe search', async () => {
		const user = userEvent.setup()
		navigationState.query = 'search=olg'
		renderWithProviders(
			<SearchRecipes
				withAvatar={false}
				searchParamName='recipeSearch'
			/>,
		)

		const input = screen.getByPlaceholderText('Search')
		await user.type(input, 'pasta')

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalled()
			const lastCall =
				mockReplace.mock.calls[mockReplace.mock.calls.length - 1][0]
			expect(lastCall).toContain('search=olg')
			expect(lastCall).toContain('recipeSearch=')
		})
	})

	it('clears the input when the search param is removed by navigation', async () => {
		navigationState.query = 'search=pasta'
		const { rerender } = renderWithProviders(
			<SearchRecipes withAvatar={false} />,
		)

		const input = screen.getByPlaceholderText('Search')
		expect(input).toHaveValue('pasta')

		navigationState.query = ''
		rerender(<SearchRecipes withAvatar={false} />)

		await waitFor(() => {
			expect(input).toHaveValue('')
		})
	})

	it('clears selected recipe filters when filter params are removed by navigation', async () => {
		const user = userEvent.setup()
		navigationState.query =
			'course=FirstCourse&categories=Pasta&sort=timeAsc&favourites=true'
		const { rerender } = renderWithProviders(
			<SearchRecipes withAvatar={false} />,
		)

		expect(screen.getByText('Quickest')).toBeInTheDocument()
		expect(screen.getByText('First course')).toBeInTheDocument()
		expect(screen.getByText('Pasta')).toBeInTheDocument()

		navigationState.query = ''
		rerender(<SearchRecipes withAvatar={false} />)

		await waitFor(() => {
			expect(screen.queryByText('Quickest')).not.toBeInTheDocument()
			expect(screen.queryByText('First course')).not.toBeInTheDocument()
			expect(screen.queryByText('Pasta')).not.toBeInTheDocument()
		})

		await user.click(screen.getByText('Favourites'))

		await waitFor(() => {
			expect(mockReplace).toHaveBeenLastCalledWith(
				expect.stringContaining('favourites=true'),
			)
		})
	})

	it('wraps the expanded search when clicking the search icon again', async () => {
		const user = userEvent.setup()
		renderWithProviders(<SearchRecipes />)

		const input = screen.getByPlaceholderText('Search')
		const searchButton = screen.getByRole('button', { name: 'Search' })

		expect(input).toHaveClass('opacity-0')

		await user.click(searchButton)
		await waitFor(() => {
			expect(input).toHaveClass('opacity-100')
		})

		await user.click(searchButton)
		await waitFor(() => {
			expect(input).toHaveClass('opacity-0')
		})
	})

	it('uses the wrapped recipe search when the avatar group is hidden', async () => {
		const user = userEvent.setup()
		renderWithProviders(<SearchRecipes withAvatar={false} />)

		const input = screen.getByPlaceholderText('Search')
		const searchButton = screen.getByRole('button', { name: 'Search' })
		const wrapper = input.parentElement

		expect(wrapper).toHaveClass('bg-forest-100')
		expect(wrapper).toHaveClass('w-14')
		expect(input).toHaveClass('opacity-0')

		await user.click(searchButton)
		await waitFor(() => {
			expect(input).toHaveClass('opacity-100')
		})
	})

	it('toggles favourites filter on click', async () => {
		const user = userEvent.setup()
		renderWithProviders(<SearchRecipes withAvatar={false} />)

		await user.click(screen.getByText('Favourites'))

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith(
				expect.stringContaining('favourites=true'),
			)
		})
	})

	it('updates URL from the combined filters modal', async () => {
		const user = userEvent.setup()
		renderWithProviders(<SearchRecipes withAvatar={false} />)

		await user.click(screen.getByText('Filters'))
		const dialog = await screen.findByRole('dialog')
		expect(dialog).toHaveClass('bottom-0')
		expect(dialog).toHaveClass('max-h-[75dvh]')
		expect(screen.getByText('Sort By')).toBeInTheDocument()
		expect(screen.getByText('Newest')).toBeInTheDocument()
		expect(screen.getByText('Quickest')).toBeInTheDocument()
		expect(
			screen.getByTestId('filters-sort-direction-desc'),
		).toBeInTheDocument()
		expect(screen.getByTestId('filters-sheet-handle')).toBeInTheDocument()
		expect(screen.getByTestId('filters-sheet-content')).toHaveClass(
			'overflow-y-auto',
		)

		await user.click(screen.getByText('Newest'))
		expect(screen.getByText('Oldest')).toBeInTheDocument()
		expect(screen.getByText('Quickest')).toBeInTheDocument()
		expect(screen.getByTestId('filters-sort-direction-asc')).toBeInTheDocument()
		await user.click(screen.getByText('Quickest'))
		expect(screen.getByTestId('filters-sort-direction-asc')).toBeInTheDocument()
		await user.click(await screen.findByText('First course'))
		await user.click(screen.getByText('Pasta'))

		expect(mockReplace).not.toHaveBeenCalled()
		await user.click(screen.getByRole('button', { name: 'Filter' }))

		await waitFor(() => {
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		})
		expect(mockReplace).toHaveBeenCalledWith(
			expect.stringContaining('course=FirstCourse'),
		)
		expect(mockReplace).toHaveBeenCalledWith(
			expect.stringContaining('categories=Pasta'),
		)
		expect(mockReplace).toHaveBeenCalledWith(
			expect.stringContaining('sort=timeAsc'),
		)
		expect(screen.getByText('Quickest')).toBeInTheDocument()
		expect(screen.getByText('First course')).toBeInTheDocument()
		expect(screen.getByText('Pasta')).toBeInTheDocument()
	})

	it('toggles saved filter when configured', async () => {
		const user = userEvent.setup()
		renderWithProviders(<SearchRecipes withAvatar={false} listFilter='saved' />)

		await user.click(screen.getByText('Saved'))

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith(
				expect.stringContaining('saved=true'),
			)
		})
	})
})
