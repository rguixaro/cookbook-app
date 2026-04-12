// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/render'
import { SearchRecipes } from './search'

const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
	useSearchParams: () => new URLSearchParams(),
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

beforeEach(() => vi.clearAllMocks())

describe('SearchRecipes', () => {
	it('renders the search input and category/favourites buttons', () => {
		renderWithProviders(<SearchRecipes withAvatar={false} />)

		expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
		expect(screen.getByText('Category')).toBeInTheDocument()
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
})
