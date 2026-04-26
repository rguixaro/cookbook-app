// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders, userEvent } from '@/test/render'
import { RecipeGallery, RecipeGalleryPlaceholder } from './gallery'

const cookieState = vi.hoisted(() => ({ ready: true }))

vi.mock('@/providers/cookie-provider', () => ({
	useCookiesReady: () => cookieState.ready,
}))

vi.mock('next/image', () => ({
	default: ({
		src,
		alt,
		onLoad,
	}: {
		src: string
		alt: string
		onLoad?: () => void
	}) => <img src={src} alt={alt} data-testid='recipe-image' onLoad={onLoad} />,
}))

describe('RecipeGalleryPlaceholder', () => {
	it('renders the empty image prompt inside the dashed placeholder', () => {
		renderWithProviders(
			<RecipeGalleryPlaceholder text='Edit this recipe to add images' />,
		)

		expect(
			screen.getByText('Edit this recipe to add images'),
		).toBeInTheDocument()
	})
})

describe('RecipeGallery', () => {
	beforeEach(() => {
		cookieState.ready = true
	})

	it('waits for signed cookies before rendering uploaded images', () => {
		cookieState.ready = false

		renderWithProviders(
			<RecipeGallery images={['https://assets.test/one.jpg']} />,
		)

		expect(screen.queryByTestId('recipe-image')).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Fullscreen recipe photo' }),
		).not.toBeInTheDocument()
	})

	it('opens the roots-style fullscreen viewer from the centered image action', async () => {
		const user = userEvent.setup()

		renderWithProviders(
			<RecipeGallery images={['https://assets.test/one.jpg']} />,
		)
		fireEvent.load(screen.getByTestId('recipe-image'))

		await user.click(screen.getByAltText('Recipe photo'))
		await user.click(
			screen.getByRole('button', { name: 'Fullscreen recipe photo' }),
		)

		expect(
			screen.getByRole('dialog', { name: 'Recipe photo viewer' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Minimize recipe photo' }),
		).toBeInTheDocument()
		expect(screen.getByAltText('Recipe photo 1').parentElement).toHaveClass(
			'scale-95',
			'opacity-0',
			'transition-all',
			'duration-500',
			'ease-out',
		)
		expect(
			screen.queryByRole('link', { name: 'Download recipe photo' }),
		).not.toBeInTheDocument()
	})
})
