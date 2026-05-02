// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render'
import type { RecipeSchema } from '@/server/schemas'
import { ItemRecipe } from './item'

const cookieState = vi.hoisted(() => ({ ready: false }))

vi.mock('@/providers/cookie-provider', () => ({
	useCookiesReady: () => cookieState.ready,
}))

vi.mock('motion/react', () => ({
	motion: {
		div: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	},
}))

vi.mock('next/image', () => ({
	default: ({
		src,
		alt,
		onLoad,
		onError,
	}: {
		src: string
		alt: string
		onLoad?: () => void
		onError?: () => void
	}) => (
		<img
			src={src}
			alt={alt}
			data-testid='recipe-image'
			onLoad={onLoad}
			onError={onError}
		/>
	),
}))

function makeRecipe(overrides: Partial<RecipeSchema> = {}): RecipeSchema {
	return {
		id: 'recipe-1',
		name: 'Pasta Carbonara',
		slug: 'pasta-carbonara',
		course: 'FirstCourse',
		categories: ['Pasta'],
		time: 30,
		ingredients: ['pasta', 'egg', 'bacon'],
		instructions: 'Cook the pasta with eggs and bacon.',
		images: ['https://assets.example.com/images/pasta.jpg'],
		sourceUrls: [],
		authorId: 'user-1',
		authorUsername: 'chef',
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
		...overrides,
	}
}

describe('ItemRecipe image loading', () => {
	beforeEach(() => {
		cookieState.ready = false
	})

	it('reserves the image rail and shows a spinner while cookies are not ready', () => {
		renderWithProviders(<ItemRecipe recipe={makeRecipe()} />)

		expect(screen.getByTestId('recipe-image-rail')).toBeInTheDocument()
		expect(
			screen.getByRole('status', { name: 'Loading recipe image' }),
		).toBeInTheDocument()
		expect(screen.queryByTestId('recipe-image')).not.toBeInTheDocument()
	})

	it('keeps the spinner visible until the image loads', () => {
		cookieState.ready = true
		renderWithProviders(<ItemRecipe recipe={makeRecipe()} />)

		expect(screen.getByTestId('recipe-image')).toBeInTheDocument()
		expect(
			screen.getByRole('status', { name: 'Loading recipe image' }),
		).toBeInTheDocument()
	})

	it('hides the spinner after the image loads', () => {
		cookieState.ready = true
		renderWithProviders(<ItemRecipe recipe={makeRecipe()} />)

		fireEvent.load(screen.getByTestId('recipe-image'))

		expect(
			screen.queryByRole('status', { name: 'Loading recipe image' }),
		).not.toBeInTheDocument()
	})

	it('shows a fallback after the image fails to load', () => {
		cookieState.ready = true
		renderWithProviders(<ItemRecipe recipe={makeRecipe()} />)

		fireEvent.error(screen.getByTestId('recipe-image'))

		expect(
			screen.queryByRole('status', { name: 'Loading recipe image' }),
		).not.toBeInTheDocument()
		expect(
			screen.getByRole('img', { name: 'Recipe image failed to load' }),
		).toBeInTheDocument()
		expect(screen.queryByTestId('recipe-image')).not.toBeInTheDocument()
	})

	it('caps the number of ingredient chips shown on the card', () => {
		renderWithProviders(
			<ItemRecipe
				recipe={makeRecipe({
					categories: ['Pasta'],
					ingredients: [
						'apple',
						'banana',
						'carrot',
						'dates',
						'eggplant',
						'fig',
						'grape',
						'honey',
					],
				})}
			/>,
		)

		expect(screen.getByText('Fig')).toBeInTheDocument()
		expect(screen.getByText('Apple')).toBeInTheDocument()
		expect(screen.queryByText('Banana')).not.toBeInTheDocument()
		expect(screen.getByText('+6')).toBeInTheDocument()
	})

	it('constrains ingredient chip width so long names truncate visually', () => {
		renderWithProviders(
			<ItemRecipe
				recipe={makeRecipe({
					ingredients: ['very long preserved lemon ingredient name'],
				})}
			/>,
		)

		const chipText = screen.getByText(
			'Very long preserved lemon ingredient name',
		)
		expect(chipText).toHaveClass('truncate')
		expect(chipText.parentElement).toHaveClass('max-w-[9rem]', 'min-w-0')
	})
})
