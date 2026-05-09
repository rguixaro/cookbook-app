// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/render'
import { AccountVerificationBanner } from './verification-banner'

vi.mock('@/server/actions/auth', () => ({
	requestEmailVerification: vi.fn().mockResolvedValue({ status: 'sent' }),
}))

import { requestEmailVerification } from '@/server/actions/auth'

describe('AccountVerificationBanner', () => {
	it('renders the unverified account warning', () => {
		renderWithProviders(<AccountVerificationBanner />)

		expect(screen.getByRole('alert')).toBeInTheDocument()
		expect(screen.getByText('Account not verified')).toBeInTheDocument()
		expect(
			screen.getByText('Your email address has not been verified yet'),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Send verification email' }),
		).toBeInTheDocument()
	})

	it('requests a verification email', async () => {
		const user = userEvent.setup()
		renderWithProviders(<AccountVerificationBanner />)

		await user.click(
			screen.getByRole('button', { name: 'Send verification email' }),
		)

		await waitFor(() => {
			expect(requestEmailVerification).toHaveBeenCalled()
			expect(
				screen.getByRole('button', { name: 'Verification email sent' }),
			).toBeDisabled()
		})
	})
})
