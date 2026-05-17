// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/render'
import { UpdateAccount } from './update-account'

vi.mock('@/server/actions', () => ({
	changePassword: vi.fn(),
	requestEmailChange: vi.fn(),
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

import {
	changePassword,
	requestEmailChange,
	updateProfile,
} from '@/server/actions'
import { DEFAULT_SIGN_OUT_REDIRECT_URL } from '@/routes'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'

const mockUpdateProfile = vi.mocked(updateProfile)
const mockRequestEmailChange = vi.mocked(requestEmailChange)
const mockChangePassword = vi.mocked(changePassword)
const mockSignOut = vi.mocked(signOut)

beforeEach(() => vi.clearAllMocks())

const defaultProps = {
	username: 'testuser',
	name: 'Test User',
	email: 'test@example.com',
	isPrivate: false,
	isCredentialsAccount: true,
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
		expect(toast.success).toHaveBeenCalledWith('Profile updated successfully')
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

	it('allows credentials accounts to request an email change', async () => {
		mockRequestEmailChange.mockResolvedValue({ status: 'sent' })
		const user = userEvent.setup()
		renderWithProviders(<UpdateAccount {...defaultProps} />)

		const emailInput = screen.getByDisplayValue('test@example.com')
		expect(emailInput).not.toBeDisabled()

		await user.clear(emailInput)
		await user.type(emailInput, 'new@example.com')
		await user.type(
			screen.getAllByLabelText('Current password')[0],
			'current-password',
		)
		await user.click(
			screen.getByRole('button', { name: /send verification link/i }),
		)

		await waitFor(() => {
			expect(mockRequestEmailChange).toHaveBeenCalledWith({
				email: 'new@example.com',
				currentPassword: 'current-password',
			})
		})
		expect(toast.success).toHaveBeenCalledWith(
			'Check your new email to finish the change',
		)
	})

	it('changes password and signs out on success', async () => {
		mockChangePassword.mockResolvedValue({ status: 'success' })
		const user = userEvent.setup()
		renderWithProviders(<UpdateAccount {...defaultProps} />)

		await user.type(
			screen.getAllByLabelText('Current password')[1],
			'current-password',
		)
		await user.type(screen.getByLabelText('New password'), 'password123456')
		await user.type(screen.getByLabelText('Confirm password'), 'password123456')
		await user.click(screen.getByRole('button', { name: /change password/i }))

		await waitFor(() => {
			expect(mockChangePassword).toHaveBeenCalledWith({
				currentPassword: 'current-password',
				password: 'password123456',
				confirmPassword: 'password123456',
			})
		})
		expect(mockSignOut).toHaveBeenCalledWith({
			redirectTo: DEFAULT_SIGN_OUT_REDIRECT_URL,
		})
	})

	it('does not submit mismatched password changes', async () => {
		const user = userEvent.setup()
		renderWithProviders(<UpdateAccount {...defaultProps} />)

		await user.type(
			screen.getAllByLabelText('Current password')[1],
			'current-password',
		)
		await user.type(screen.getByLabelText('New password'), 'password123456')
		await user.type(screen.getByLabelText('Confirm password'), 'password654321')
		await user.click(screen.getByRole('button', { name: /change password/i }))

		await waitFor(() => {
			expect(mockChangePassword).not.toHaveBeenCalled()
		})
	})

	it('keeps email disabled for google-only accounts', () => {
		renderWithProviders(
			<UpdateAccount {...defaultProps} isCredentialsAccount={false} />,
		)

		const emailInput = screen.getByDisplayValue('test@example.com')
		expect(emailInput).toBeDisabled()
		expect(
			screen.queryByRole('button', { name: /change password/i }),
		).not.toBeInTheDocument()
	})
})
