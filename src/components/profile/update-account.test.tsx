// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/render'
import { UpdateAccount } from './update-account'

vi.mock('@/server/actions', () => ({
	updateProfile: vi.fn(),
	deleteProfile: vi.fn(),
}))

vi.mock('sonner', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('next-auth/react', () => ({
	signOut: vi.fn(),
}))

vi.mock('next/dist/client/components/redirect-error', () => ({
	isRedirectError: () => false,
}))

import { updateProfile } from '@/server/actions'
import { toast } from 'sonner'

const mockUpdateProfile = vi.mocked(updateProfile)

beforeEach(() => vi.clearAllMocks())

const defaultProps = {
	username: 'testuser',
	name: 'Test User',
	email: 'test@example.com',
	isPrivate: false,
}

describe('UpdateAccount', () => {
	it('renders the form with default values', () => {
		renderWithProviders(<UpdateAccount {...defaultProps} />)

		expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
		expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
	})

	it('disables submit button when values are unchanged', () => {
		renderWithProviders(<UpdateAccount {...defaultProps} />)

		const saveBtn = screen.getByRole('button', { name: /save/i })
		expect(saveBtn).toBeDisabled()
	})

	it('enables submit button when name changes', async () => {
		const user = userEvent.setup()
		renderWithProviders(<UpdateAccount {...defaultProps} />)

		const nameInput = screen.getByDisplayValue('Test User')
		await user.clear(nameInput)
		await user.type(nameInput, 'New Name')

		const saveBtn = screen.getByRole('button', { name: /save/i })
		expect(saveBtn).not.toBeDisabled()
	})

	it('calls updateProfile on submit and shows success toast', async () => {
		mockUpdateProfile.mockResolvedValue(undefined)
		const user = userEvent.setup()
		renderWithProviders(<UpdateAccount {...defaultProps} />)

		const nameInput = screen.getByDisplayValue('Test User')
		await user.clear(nameInput)
		await user.type(nameInput, 'New Name')

		await user.click(screen.getByRole('button', { name: /save/i }))

		await waitFor(() => {
			expect(mockUpdateProfile).toHaveBeenCalledWith({
				name: 'New Name',
				isPrivate: false,
			})
		})
		expect(toast.success).toHaveBeenCalledWith(
			'Profile updated successfully',
		)
	})

	it('shows error toast when updateProfile fails', async () => {
		mockUpdateProfile.mockRejectedValue(new Error('fail'))
		const user = userEvent.setup()
		renderWithProviders(<UpdateAccount {...defaultProps} />)

		const nameInput = screen.getByDisplayValue('Test User')
		await user.clear(nameInput)
		await user.type(nameInput, 'New Name')

		await user.click(screen.getByRole('button', { name: /save/i }))

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('An error occurred')
		})
	})

	it('shows email as disabled', () => {
		renderWithProviders(<UpdateAccount {...defaultProps} />)

		const emailInput = screen.getByDisplayValue('test@example.com')
		expect(emailInput).toBeDisabled()
	})
})
