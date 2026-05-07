// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/render'
import { SearchProfiles } from './search'

const navigationState = vi.hoisted(() => ({ query: '' }))
const mockReplace = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
	useSearchParams: () => new URLSearchParams(navigationState.query),
	usePathname: () => '/profiles',
	useRouter: () => ({ replace: mockReplace }),
}))

vi.mock('use-debounce', () => ({
	useDebouncedCallback: (fn: Function) => fn,
}))

beforeEach(() => {
	vi.clearAllMocks()
	navigationState.query = ''
})

describe('SearchProfiles', () => {
	it('keeps the users search expanded', async () => {
		const user = userEvent.setup()
		renderWithProviders(<SearchProfiles />)

		const input = screen.getByPlaceholderText('Search')
		const searchButton = screen.getByRole('button', { name: 'Search' })
		const wrapper = input.parentElement

		expect(input).toHaveClass('w-full')
		expect(input).toHaveClass('opacity-100')
		expect(wrapper).toHaveClass('bg-forest-100')
		expect(wrapper).toHaveClass('w-72')
		expect(wrapper).toHaveClass('h-12')

		await user.click(searchButton)
		expect(input).toHaveClass('opacity-100')
	})

	it('updates URL when typing in users search', async () => {
		const user = userEvent.setup()
		renderWithProviders(<SearchProfiles />)

		await user.type(screen.getByPlaceholderText('Search'), 'chef')

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalled()
			const lastCall =
				mockReplace.mock.calls[mockReplace.mock.calls.length - 1][0]
			expect(lastCall).toContain('search=')
		})
	})

	it('clears the input when the search param is removed by navigation', async () => {
		navigationState.query = 'search=qqweqweqq'
		const { rerender } = renderWithProviders(<SearchProfiles />)

		const input = screen.getByPlaceholderText('Search')
		expect(input).toHaveValue('qqweqweqq')

		navigationState.query = ''
		rerender(<SearchProfiles />)

		await waitFor(() => {
			expect(input).toHaveValue('')
		})
	})
})
