// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/render'
import { DeleteAccount } from './delete-account'

vi.mock('@/server/actions', () => ({
	deleteProfile: vi.fn(),
}))

vi.mock('sonner', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('next/dist/client/components/redirect-error', () => ({
	isRedirectError: () => false,
}))

import { deleteProfile } from '@/server/actions'
import { toast } from 'sonner'

const mockDeleteProfile = vi.mocked(deleteProfile)

beforeEach(() => vi.clearAllMocks())

const EMAIL = 'test@example.com'

function renderDeleteAccount() {
	return renderWithProviders(
		<DeleteAccount trigger={<button>Delete my account</button>} email={EMAIL} />,
	)
}

describe('DeleteAccount', () => {
	it('renders the trigger button', () => {
		renderDeleteAccount()
		expect(screen.getByText('Delete my account')).toBeInTheDocument()
	})

	it('opens dialog when trigger is clicked', async () => {
		const user = userEvent.setup()
		renderDeleteAccount()

		await user.click(screen.getByText('Delete my account'))

		await waitFor(() => {
			expect(screen.getByText('Delete account')).toBeInTheDocument()
		})
	})

	it('keeps delete button disabled until email matches', async () => {
		const user = userEvent.setup()
		renderDeleteAccount()

		await user.click(screen.getByText('Delete my account'))

		await waitFor(() => {
			expect(screen.getByText('Delete account')).toBeInTheDocument()
		})

		const deleteBtn = screen.getByRole('button', { name: /^Delete$/i })
		expect(deleteBtn).toBeDisabled()
	})

	it('shows error toast when email does not match on submit', async () => {
		const user = userEvent.setup()
		renderDeleteAccount()

		await user.click(screen.getByText('Delete my account'))

		await waitFor(() => {
			expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
		})

		await user.type(screen.getByPlaceholderText('Email'), 'wrong@email.com')

		const deleteBtn = screen.getByRole('button', { name: /^Delete$/i })
		expect(deleteBtn).toBeDisabled()
	})

	it('calls deleteProfile when email matches and form is submitted', async () => {
		mockDeleteProfile.mockResolvedValue(true)
		const user = userEvent.setup()
		renderDeleteAccount()

		await user.click(screen.getByText('Delete my account'))

		await waitFor(() => {
			expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
		})

		await user.type(screen.getByPlaceholderText('Email'), EMAIL)

		const deleteBtn = screen.getByRole('button', { name: /^Delete$/i })
		expect(deleteBtn).not.toBeDisabled()

		await user.click(deleteBtn)

		await waitFor(() => {
			expect(mockDeleteProfile).toHaveBeenCalledOnce()
		})
		expect(toast.success).toHaveBeenCalledWith('Your account has been deleted')
	})

	it('shows error toast when deleteProfile fails', async () => {
		mockDeleteProfile.mockRejectedValue(new Error('fail'))
		const user = userEvent.setup()
		renderDeleteAccount()

		await user.click(screen.getByText('Delete my account'))

		await waitFor(() => {
			expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
		})

		await user.type(screen.getByPlaceholderText('Email'), EMAIL)
		await user.click(screen.getByRole('button', { name: /^Delete$/i }))

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(
				'An error occurred while deleting your account',
			)
		})
	})
})
