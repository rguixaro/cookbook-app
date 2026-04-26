// @vitest-environment jsdom
import { type ReactNode, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/render'
import { SourceLinksInput } from './source-links-input'

vi.mock('@/ui', async () => {
	const actual = await vi.importActual<typeof import('@/ui')>('@/ui')

	return {
		...actual,
		FormControl: ({ children }: { children: ReactNode }) => <>{children}</>,
	}
})

function TestSourceLinksInput({ initial = [] }: { initial?: string[] }) {
	const [values, setValues] = useState(initial)

	return <SourceLinksInput values={values} setValues={setValues} />
}

describe('SourceLinksInput', () => {
	it('adds a valid HTTP URL from the button', async () => {
		const user = userEvent.setup()
		renderWithProviders(<TestSourceLinksInput />)

		await user.type(
			screen.getByPlaceholderText('https://example.com/recipe'),
			'https://example.com/recipe',
		)
		await user.click(screen.getByRole('button', { name: 'Add' }))

		expect(screen.getByText('https://example.com/recipe')).toBeInTheDocument()
		expect(screen.getByPlaceholderText('https://example.com/recipe')).toHaveValue(
			'',
		)
	})

	it('prevents invalid URLs and shows an invalid link message', async () => {
		const user = userEvent.setup()
		renderWithProviders(<TestSourceLinksInput />)

		const input = screen.getByPlaceholderText('https://example.com/recipe')
		await user.type(input, 'example.com/recipe')

		expect(input).toHaveAttribute('aria-invalid', 'true')
		expect(
			screen.getByText('Enter a valid link starting with http:// or https://'),
		).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
	})

	it('adds valid URLs from newline paste', () => {
		renderWithProviders(<TestSourceLinksInput />)

		fireEvent.paste(screen.getByPlaceholderText('https://example.com/recipe'), {
			clipboardData: {
				getData: () => 'https://example.com/a\nnot-a-url\nhttps://example.com/b',
			},
		})

		expect(screen.getByText('https://example.com/a')).toBeInTheDocument()
		expect(screen.getByText('https://example.com/b')).toBeInTheDocument()
		expect(screen.queryByText('not-a-url')).not.toBeInTheDocument()
	})

	it('enforces the max of two source URLs', async () => {
		const user = userEvent.setup()
		renderWithProviders(
			<TestSourceLinksInput
				initial={['https://example.com/a', 'https://example.com/b']}
			/>,
		)

		const input = screen.getByPlaceholderText('https://example.com/recipe')
		expect(input).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()

		await user.click(
			screen.getByRole('button', { name: 'Remove https://example.com/a' }),
		)

		expect(screen.getByPlaceholderText('https://example.com/recipe')).toBeEnabled()
	})
})
