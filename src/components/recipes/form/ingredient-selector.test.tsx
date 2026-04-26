// @vitest-environment jsdom
import { type ReactNode, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/render'
import { IngredientSelector } from './ingredient-selector'

vi.mock('@/ui', async () => {
	const actual = await vi.importActual<typeof import('@/ui')>('@/ui')

	return {
		...actual,
		FormControl: ({ children }: { children: ReactNode }) => <>{children}</>,
	}
})

function TestIngredientSelector({ initial = [] }: { initial?: string[] }) {
	const [values, setValues] = useState(initial)

	return <IngredientSelector values={values} setValues={setValues} />
}

describe('IngredientSelector', () => {
	it('adds a typed ingredient from the button', async () => {
		const user = userEvent.setup()
		renderWithProviders(<TestIngredientSelector />)

		await user.type(screen.getByPlaceholderText('e.g. 2 eggs'), 'flour')
		await user.click(screen.getByRole('button', { name: 'Add' }))

		expect(screen.getByText('flour')).toBeInTheDocument()
		expect(screen.getByPlaceholderText('e.g. 2 eggs')).toHaveValue('')
	})

	it('adds a typed ingredient with Enter', async () => {
		const user = userEvent.setup()
		renderWithProviders(<TestIngredientSelector />)

		await user.type(screen.getByPlaceholderText('e.g. 2 eggs'), 'sugar{Enter}')

		expect(screen.getByText('sugar')).toBeInTheDocument()
	})

	it('adds multiple ingredients from comma and newline paste', () => {
		renderWithProviders(<TestIngredientSelector />)

		fireEvent.paste(screen.getByPlaceholderText('e.g. 2 eggs'), {
			clipboardData: { getData: () => 'flour, sugar\nsalt' },
		})

		expect(screen.getByText('flour')).toBeInTheDocument()
		expect(screen.getByText('sugar')).toBeInTheDocument()
		expect(screen.getByText('salt')).toBeInTheDocument()
	})

	it('ignores empty values', () => {
		renderWithProviders(<TestIngredientSelector />)

		expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
	})

	it('rejects ingredients without at least two letters', async () => {
		const user = userEvent.setup()
		renderWithProviders(<TestIngredientSelector />)

		await user.type(screen.getByPlaceholderText('e.g. 2 eggs'), ',.-º12?¿¿')

		expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
		expect(screen.getByText('Enter at least two letters')).toBeInTheDocument()
	})

	it('ignores invalid ingredients from paste', () => {
		renderWithProviders(<TestIngredientSelector />)

		fireEvent.paste(screen.getByPlaceholderText('e.g. 2 eggs'), {
			clipboardData: { getData: () => '1, x\nsalt' },
		})

		expect(screen.getByText('salt')).toBeInTheDocument()
		expect(screen.queryByText('1')).not.toBeInTheDocument()
		expect(screen.queryByText('x')).not.toBeInTheDocument()
	})

	it('removes an ingredient', async () => {
		const user = userEvent.setup()
		renderWithProviders(<TestIngredientSelector initial={['flour']} />)

		await user.click(screen.getByRole('button', { name: 'Remove flour' }))

		expect(screen.queryByText('flour')).not.toBeInTheDocument()
	})
})
