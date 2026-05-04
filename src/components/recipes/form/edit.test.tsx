// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { renderWithProviders, userEvent } from '@/test/render'
import { EditRecipe } from './edit'
import type { Recipe } from '@/types'
import { Form, FormField, FormItem, FormMessage } from '@/ui'

const routerMocks = vi.hoisted(() => ({
	replace: vi.fn(),
	refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
	useRouter: () => routerMocks,
}))

vi.mock('@/server/actions', () => ({
	updateRecipe: vi.fn(),
	uploadRecipeImages: vi.fn(),
	updateRecipeImages: vi.fn(),
	deleteRecipe: vi.fn(),
}))

vi.mock('sonner', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@sentry/nextjs', () => ({
	captureException: vi.fn(),
}))

import { deleteRecipe, updateRecipe, updateRecipeImages } from '@/server/actions'
import { toast } from 'sonner'

const mockDeleteRecipe = vi.mocked(deleteRecipe)
const mockUpdateRecipe = vi.mocked(updateRecipe)
const mockUpdateRecipeImages = vi.mocked(updateRecipeImages)

const recipe: Recipe = {
	id: 'recipe-1',
	slug: 'paella',
	name: 'Paella',
	time: 45,
	instructions: 'Cook the rice with stock until tender.',
	ingredients: ['rice', 'stock'],
	complements: [],
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	updatedAt: new Date('2026-01-01T00:00:00.000Z'),
	course: 'SecondCourse',
	categories: ['Fish'],
	authorId: 'user-1',
	authorUsername: 'testuser',
	images: [],
	sourceUrls: [],
}

beforeEach(() => {
	vi.clearAllMocks()
})

function renderEditRecipe(overrides: Partial<Recipe> = {}) {
	return renderWithProviders(<EditRecipe recipe={{ ...recipe, ...overrides }} />)
}

function NestedIngredientErrorForm() {
	const form = useForm<{ ingredients: string[] }>({
		defaultValues: { ingredients: ['rice'] },
	})

	useEffect(() => {
		form.setError('ingredients.0', {
			type: 'manual',
			message: 'ingredient-too-long',
		})
	}, [form])

	return (
		<Form {...form}>
			<FormField
				control={form.control}
				name='ingredients'
				render={() => (
					<FormItem>
						<FormMessage />
					</FormItem>
				)}
			/>
		</Form>
	)
}

describe('EditRecipe delete flow', () => {
	it('renders a subtle delete trigger outside the edit form', () => {
		renderEditRecipe()

		expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument()
		const deleteTrigger = screen.getByRole('button', {
			name: 'Delete recipe',
		})

		expect(deleteTrigger).toBeInTheDocument()
		expect(deleteTrigger.closest('form')).toBeNull()
	})

	it('keeps the cooking time input digit-only', async () => {
		const user = userEvent.setup()
		renderEditRecipe()

		const timeInput = await screen.findByDisplayValue('45')
		await user.clear(timeInput)
		await user.type(timeInput, '1e2-3.4abc')

		expect(timeInput).toHaveValue('1234')
	})

	it('renders the ingredient input error through the outer field message', async () => {
		const user = userEvent.setup()
		renderEditRecipe()

		await user.type(screen.getByRole('textbox', { name: 'Ingredients' }), '1')

		const message = screen.getByText('Enter at least two letters')
		expect(message).toBeInTheDocument()
		expect(message).toHaveClass('bg-forest-50')
		expect(screen.getAllByText('Enter at least two letters')).toHaveLength(1)
	})

	it('renders nested ingredient errors without an undefined translation key', async () => {
		renderWithProviders(<NestedIngredientErrorForm />)

		expect(
			await screen.findByText('Use 35 characters or fewer'),
		).toBeInTheDocument()
		expect(screen.queryByText('error.undefined')).not.toBeInTheDocument()
	})

	it('submits when unchanged legacy overlong ingredients are present', async () => {
		const legacyIngredient = 'very long preserved lemon ingredient name'
		mockUpdateRecipe.mockResolvedValue({
			error: false,
			recipePath: '/recipes/testuser/paella-updated',
		})
		mockUpdateRecipeImages.mockResolvedValue({ error: false })
		const user = userEvent.setup()
		renderEditRecipe({ ingredients: [legacyIngredient] })

		const nameInput = screen.getByDisplayValue('Paella')
		await user.clear(nameInput)
		await user.type(nameInput, 'Paella updated')
		await user.click(screen.getByRole('button', { name: 'Update' }))

		await waitFor(() => {
			expect(mockUpdateRecipe).toHaveBeenCalledWith(
				'recipe-1',
				expect.objectContaining({
					name: 'Paella updated',
					ingredients: [legacyIngredient],
				}),
			)
		})
	})

	it('opens confirmation dialog and requires the confirmation word', async () => {
		const user = userEvent.setup()
		renderEditRecipe()

		await user.click(screen.getByRole('button', { name: 'Delete recipe' }))

		expect(screen.getByRole('dialog')).toBeInTheDocument()
		expect(screen.getAllByText('Delete recipe')).toHaveLength(2)

		const deleteButton = screen.getByRole('button', { name: /^Delete$/i })
		expect(deleteButton).toBeDisabled()

		await user.type(screen.getByPlaceholderText('delete'), 'delete')

		expect(deleteButton).not.toBeDisabled()
	})

	it('deletes the recipe, shows success, and redirects to the feed', async () => {
		mockDeleteRecipe.mockResolvedValue({ error: false })
		const user = userEvent.setup()
		renderEditRecipe()

		await user.click(screen.getByRole('button', { name: 'Delete recipe' }))
		await user.type(screen.getByPlaceholderText('delete'), 'delete')
		await user.click(screen.getByRole('button', { name: /^Delete$/i }))

		await waitFor(() => {
			expect(mockDeleteRecipe).toHaveBeenCalledWith('recipe-1')
		})
		expect(toast.success).toHaveBeenCalledWith('Recipe deleted successfully')
		expect(routerMocks.replace).toHaveBeenCalledWith('/')
		expect(routerMocks.refresh).toHaveBeenCalledOnce()
	})

	it('shows an error toast and stays on the form when deletion fails', async () => {
		mockDeleteRecipe.mockResolvedValue({ error: true })
		const user = userEvent.setup()
		renderEditRecipe()

		await user.click(screen.getByRole('button', { name: 'Delete recipe' }))
		await user.type(screen.getByPlaceholderText('delete'), 'delete')
		await user.click(screen.getByRole('button', { name: /^Delete$/i }))

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('An error occurred')
		})
		expect(routerMocks.replace).not.toHaveBeenCalled()
		expect(screen.getByRole('dialog')).toBeInTheDocument()
	})
})
