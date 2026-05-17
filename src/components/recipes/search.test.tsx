// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
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

beforeEach(() => {
	vi.clearAllMocks()
	navigationState.query = ''
})

afterEach(() => {
	vi.clearAllTimers()
	vi.useRealTimers()
})

const advanceSearchDebounce = (ms = 450) => {
	act(() => {
		vi.advanceTimersByTime(ms)
	})
}

const getClearButton = (input: HTMLElement) =>
	input.parentElement?.querySelector('button:last-of-type') as HTMLButtonElement

const expectLastReplaceParams = (expected: Record<string, string>) => {
	const lastCall = mockReplace.mock.calls[mockReplace.mock.calls.length - 1]
	const url = lastCall[0] as string
	const query = url.includes('?') ? url.split('?')[1] : ''
	const params = new URLSearchParams(query)

	for (const [key, value] of Object.entries(expected)) {
		expect(params.get(key)).toBe(value)
	}
}

describe('SearchRecipes', () => {
	it('renders the search input and filters/favourites buttons', () => {
		renderWithProviders(<SearchRecipes withAvatar={false} />)

		expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
		expect(screen.getByText('Filters')).toBeInTheDocument()
		expect(screen.getByText('Favourites')).toBeInTheDocument()
	})

	it('updates URL only after typing pauses', async () => {
		vi.useFakeTimers()
		renderWithProviders(<SearchRecipes withAvatar={false} />)

		const input = screen.getByPlaceholderText('Search')
		fireEvent.change(input, { target: { value: 'pas' } })
		expect(input).toHaveValue('pas')
		expect(mockReplace).not.toHaveBeenCalled()

		advanceSearchDebounce(300)
		fireEvent.change(input, { target: { value: 'pasta' } })
		advanceSearchDebounce(449)
		expect(mockReplace).not.toHaveBeenCalled()

		advanceSearchDebounce(1)
		expect(mockReplace).toHaveBeenCalledTimes(1)
		expect(mockReplace).toHaveBeenLastCalledWith('/?search=pasta', {
			scroll: false,
		})
	})

	it('can use a separate URL param for profile recipe search', async () => {
		vi.useFakeTimers()
		navigationState.query = 'search=olg'
		renderWithProviders(
			<SearchRecipes withAvatar={false} searchParamName='recipeSearch' />,
		)

		const input = screen.getByPlaceholderText('Search')
		fireEvent.change(input, { target: { value: 'pasta' } })
		advanceSearchDebounce()

		expect(mockReplace).toHaveBeenCalledTimes(1)
		const lastCall = mockReplace.mock.calls[mockReplace.mock.calls.length - 1]
		expect(lastCall[0]).toContain('search=olg')
		expect(lastCall[0]).toContain('recipeSearch=pasta')
		expect(lastCall[1]).toEqual({ scroll: false })
	})

	it('clears search immediately and cancels the pending typed value', async () => {
		vi.useFakeTimers()
		renderWithProviders(<SearchRecipes withAvatar={false} />)

		const input = screen.getByPlaceholderText('Search')
		fireEvent.change(input, { target: { value: 'pasta' } })
		fireEvent.click(getClearButton(input))

		expect(input).toHaveValue('')
		expect(mockReplace).toHaveBeenCalledTimes(1)
		expect(mockReplace).toHaveBeenLastCalledWith('/', { scroll: false })

		advanceSearchDebounce()
		expect(mockReplace).toHaveBeenCalledTimes(1)
	})

	it('commits search immediately on Enter', async () => {
		vi.useFakeTimers()
		renderWithProviders(<SearchRecipes withAvatar={false} />)

		const input = screen.getByPlaceholderText('Search')
		fireEvent.change(input, { target: { value: 'pasta' } })
		fireEvent.keyDown(input, { key: 'Enter' })

		expect(mockReplace).toHaveBeenCalledTimes(1)
		expect(mockReplace).toHaveBeenLastCalledWith('/?search=pasta', {
			scroll: false,
		})

		advanceSearchDebounce()
		expect(mockReplace).toHaveBeenCalledTimes(1)
	})

	it('commits search immediately on blur', async () => {
		vi.useFakeTimers()
		renderWithProviders(<SearchRecipes withAvatar={false} />)

		const input = screen.getByPlaceholderText('Search')
		fireEvent.change(input, { target: { value: 'pasta' } })
		fireEvent.blur(input)

		expect(mockReplace).toHaveBeenCalledTimes(1)
		expect(mockReplace).toHaveBeenLastCalledWith('/?search=pasta', {
			scroll: false,
		})

		advanceSearchDebounce()
		expect(mockReplace).toHaveBeenCalledTimes(1)
	})

	it('preserves pending search when toggling favourites before debounce fires', async () => {
		vi.useFakeTimers()
		renderWithProviders(<SearchRecipes withAvatar={false} />)

		const input = screen.getByPlaceholderText('Search')
		input.focus()
		fireEvent.change(input, { target: { value: 'pasta' } })
		fireEvent.blur(input)
		fireEvent.click(screen.getByText('Favourites'))

		expectLastReplaceParams({
			search: 'pasta',
			favourites: 'true',
		})

		advanceSearchDebounce()
		expect(mockReplace).toHaveBeenCalledTimes(2)
		expectLastReplaceParams({
			search: 'pasta',
			favourites: 'true',
		})
	})

	it('keeps the local draft when an older search param arrives while focused', async () => {
		vi.useFakeTimers()
		const { rerender } = renderWithProviders(
			<SearchRecipes withAvatar={false} />,
		)

		const input = screen.getByPlaceholderText('Search')
		input.focus()
		fireEvent.change(input, { target: { value: 'pasta' } })

		navigationState.query = 'search=pa'
		rerender(<SearchRecipes withAvatar={false} />)

		expect(input).toHaveValue('pasta')
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
			'course=first_course&categories=pasta&sort=timeAsc&favourites=true'
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
			expect.stringContaining('course=first_course'),
		)
		expect(mockReplace).toHaveBeenCalledWith(
			expect.stringContaining('categories=pasta'),
		)
		expect(mockReplace).toHaveBeenCalledWith(
			expect.stringContaining('sort=timeAsc'),
		)
		expect(screen.getByText('Quickest')).toBeInTheDocument()
		expect(screen.getByText('First course')).toBeInTheDocument()
		expect(screen.getByText('Pasta')).toBeInTheDocument()
	})

	it('preserves pending search when applying filters before debounce fires', async () => {
		vi.useFakeTimers()
		renderWithProviders(<SearchRecipes withAvatar={false} />)

		const input = screen.getByPlaceholderText('Search')
		input.focus()
		fireEvent.change(input, { target: { value: 'pasta' } })
		fireEvent.blur(input)
		fireEvent.click(screen.getByText('Filters'))

		expect(screen.getByRole('dialog')).toBeInTheDocument()
		fireEvent.click(screen.getByText('Newest'))
		fireEvent.click(screen.getByText('Quickest'))
		fireEvent.click(screen.getByText('First course'))
		fireEvent.click(screen.getByText('Pasta'))
		fireEvent.click(screen.getByRole('button', { name: 'Filter' }))

		expectLastReplaceParams({
			search: 'pasta',
			course: 'first_course',
			categories: 'pasta',
			sort: 'timeAsc',
		})

		advanceSearchDebounce()
		expect(mockReplace).toHaveBeenCalledTimes(2)
		expectLastReplaceParams({
			search: 'pasta',
			course: 'first_course',
			categories: 'pasta',
			sort: 'timeAsc',
		})
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
