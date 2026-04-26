// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/render'
import { SocialLogin } from './social-login'

vi.mock('next-auth/react', () => ({
	signIn: vi.fn(),
}))

vi.mock('next/navigation', () => ({
	useSearchParams: vi.fn(),
}))

vi.mock('sonner', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}))

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

const mockSignIn = vi.mocked(signIn)
const mockUseSearchParams = vi.mocked(useSearchParams)

beforeEach(() => {
	vi.clearAllMocks()
	mockUseSearchParams.mockReturnValue(new URLSearchParams() as any)
})

describe('SocialLogin', () => {
	it('renders the Google login button', () => {
		renderWithProviders(<SocialLogin />)
		expect(screen.getByText('Continue with Google')).toBeInTheDocument()
	})

	it('calls signIn with google provider on click', async () => {
		mockSignIn.mockResolvedValue(undefined as any)
		const user = userEvent.setup()

		renderWithProviders(<SocialLogin />)
		await user.click(screen.getByText('Continue with Google'))

		await waitFor(() => {
			expect(mockSignIn).toHaveBeenCalledWith('google', {
				callbackUrl: '/',
			})
		})
	})

	it('uses callbackUrl from search params when valid', async () => {
		mockUseSearchParams.mockReturnValue(
			new URLSearchParams('callbackUrl=/recipes') as any,
		)
		mockSignIn.mockResolvedValue(undefined as any)
		const user = userEvent.setup()

		renderWithProviders(<SocialLogin />)
		await user.click(screen.getByText('Continue with Google'))

		await waitFor(() => {
			expect(mockSignIn).toHaveBeenCalledWith('google', {
				callbackUrl: '/recipes',
			})
		})
	})

	it('rejects absolute callbackUrl (//evil.com)', async () => {
		mockUseSearchParams.mockReturnValue(
			new URLSearchParams('callbackUrl=//evil.com') as any,
		)
		mockSignIn.mockResolvedValue(undefined as any)
		const user = userEvent.setup()

		renderWithProviders(<SocialLogin />)
		await user.click(screen.getByText('Continue with Google'))

		await waitFor(() => {
			expect(mockSignIn).toHaveBeenCalledWith('google', {
				callbackUrl: '/',
			})
		})
	})

	it('shows error toast when signIn fails', async () => {
		mockSignIn.mockRejectedValue(new Error('fail'))
		const user = userEvent.setup()

		renderWithProviders(<SocialLogin />)
		await user.click(screen.getByText('Continue with Google'))

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(
				'An error occurred while signing in',
			)
		})
	})
})
