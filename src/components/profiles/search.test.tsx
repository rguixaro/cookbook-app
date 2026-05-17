// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/render'
import { SearchProfiles } from './search'

const navigationState = vi.hoisted(() => ({ query: '' }))
const mockReplace = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
	useSearchParams: () => new URLSearchParams(navigationState.query),
	usePathname: () => '/profiles',
	useRouter: () => ({ replace: mockReplace }),
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

	it('updates URL only after typing pauses', async () => {
		vi.useFakeTimers()
		renderWithProviders(<SearchProfiles />)

		const input = screen.getByPlaceholderText('Search')
		fireEvent.change(input, { target: { value: 'che' } })
		expect(input).toHaveValue('che')
		expect(mockReplace).not.toHaveBeenCalled()

		advanceSearchDebounce(300)
		fireEvent.change(input, { target: { value: 'chef' } })
		advanceSearchDebounce(449)
		expect(mockReplace).not.toHaveBeenCalled()

		advanceSearchDebounce(1)
		expect(mockReplace).toHaveBeenCalledTimes(1)
		expect(mockReplace).toHaveBeenLastCalledWith('/profiles?search=chef', {
			scroll: false,
		})
	})

	it('clears search immediately and cancels the pending typed value', async () => {
		vi.useFakeTimers()
		renderWithProviders(<SearchProfiles />)

		const input = screen.getByPlaceholderText('Search')
		fireEvent.change(input, { target: { value: 'chef' } })
		fireEvent.click(getClearButton(input))

		expect(input).toHaveValue('')
		expect(mockReplace).toHaveBeenCalledTimes(1)
		expect(mockReplace).toHaveBeenLastCalledWith('/profiles', {
			scroll: false,
		})

		advanceSearchDebounce()
		expect(mockReplace).toHaveBeenCalledTimes(1)
	})

	it('commits search immediately on Enter', async () => {
		vi.useFakeTimers()
		renderWithProviders(<SearchProfiles />)

		const input = screen.getByPlaceholderText('Search')
		fireEvent.change(input, { target: { value: 'chef' } })
		fireEvent.keyDown(input, { key: 'Enter' })

		expect(mockReplace).toHaveBeenCalledTimes(1)
		expect(mockReplace).toHaveBeenLastCalledWith('/profiles?search=chef', {
			scroll: false,
		})

		advanceSearchDebounce()
		expect(mockReplace).toHaveBeenCalledTimes(1)
	})

	it('commits search immediately on blur', async () => {
		vi.useFakeTimers()
		renderWithProviders(<SearchProfiles />)

		const input = screen.getByPlaceholderText('Search')
		fireEvent.change(input, { target: { value: 'chef' } })
		fireEvent.blur(input)

		expect(mockReplace).toHaveBeenCalledTimes(1)
		expect(mockReplace).toHaveBeenLastCalledWith('/profiles?search=chef', {
			scroll: false,
		})

		advanceSearchDebounce()
		expect(mockReplace).toHaveBeenCalledTimes(1)
	})

	it('keeps the local draft when an older search param arrives while focused', async () => {
		vi.useFakeTimers()
		const { rerender } = renderWithProviders(<SearchProfiles />)

		const input = screen.getByPlaceholderText('Search')
		input.focus()
		fireEvent.change(input, { target: { value: 'chef' } })

		navigationState.query = 'search=che'
		rerender(<SearchProfiles />)

		expect(input).toHaveValue('chef')
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
