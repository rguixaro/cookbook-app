// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/render'
import { CredentialsLogin } from './credentials-login'

const { mockPush, mockRefresh } = vi.hoisted(() => ({
	mockPush: vi.fn(),
	mockRefresh: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
	signIn: vi.fn(),
}))

vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
		refresh: mockRefresh,
	}),
	useSearchParams: vi.fn(),
}))

vi.mock('@/server/actions/auth', () => ({
	signUpWithCredentials: vi.fn(),
}))

vi.mock('sonner', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}))

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { signUpWithCredentials } from '@/server/actions/auth'
import { toast } from 'sonner'

const mockSignIn = vi.mocked(signIn)
const mockUseSearchParams = vi.mocked(useSearchParams)
const mockSignUpWithCredentials = vi.mocked(signUpWithCredentials)

beforeEach(() => {
	vi.clearAllMocks()
	mockUseSearchParams.mockReturnValue(new URLSearchParams() as any)
})

describe('CredentialsLogin', () => {
	it('renders the initial authentication choices', () => {
		renderWithProviders(<CredentialsLogin />)

		expect(screen.getByText('Continue with Google')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
		expect(screen.getByText('Sign up with an email')).toBeInTheDocument()
		expect(screen.getByText('Terms')).toHaveAttribute('href', '/terms')
		expect(screen.getByText('Privacy Policy')).toHaveAttribute(
			'href',
			'/privacy',
		)
		expect(screen.queryByPlaceholderText('Email')).not.toBeInTheDocument()
	})

	it('calls signIn with google from the initial choices', async () => {
		mockSignIn.mockResolvedValue(undefined as any)

		renderWithProviders(<CredentialsLogin />)
		fireEvent.click(screen.getByText('Continue with Google'))

		await waitFor(() => {
			expect(mockSignIn).toHaveBeenCalledWith('google', {
				callbackUrl: '/',
			})
		})
	})

	it('signs in with email and password', async () => {
		mockSignIn.mockResolvedValue({ url: '/recipes' } as any)

		renderWithProviders(<CredentialsLogin />)
		fireEvent.click(screen.getByText('Login'))
		expect(screen.getByText('Continue with Google')).toBeInTheDocument()
		expect(screen.getByText('Terms')).toHaveAttribute('href', '/terms')
		expect(screen.getByText('Privacy Policy')).toHaveAttribute(
			'href',
			'/privacy',
		)
		expect(await screen.findByText('Forgot password?')).toHaveAttribute(
			'href',
			'/auth/forgot-password',
		)
		fireEvent.change(await screen.findByPlaceholderText('Email'), {
			target: { value: 'cook@example.com' },
		})
		fireEvent.change(screen.getByPlaceholderText('Password'), {
			target: { value: 'password123456' },
		})
		fireEvent.click(screen.getByText('Sign in with email'))

		await waitFor(() => {
			expect(mockSignIn).toHaveBeenCalledWith('credentials', {
				email: 'cook@example.com',
				password: 'password123456',
				redirect: false,
				callbackUrl: '/',
			})
			expect(mockPush).toHaveBeenCalledWith('/recipes')
		})
	})

	it('creates an account before signing in', async () => {
		mockSignUpWithCredentials.mockResolvedValue({ status: 'success' })
		mockSignIn.mockResolvedValue({ url: '/' } as any)

		renderWithProviders(<CredentialsLogin />)
		fireEvent.click(screen.getByText('Sign up with an email'))
		expect(screen.getByText('Continue with Google')).toBeInTheDocument()
		fireEvent.change(await screen.findByPlaceholderText('Email'), {
			target: { value: 'cook@example.com' },
		})
		fireEvent.change(screen.getByPlaceholderText('Password'), {
			target: { value: 'password123456' },
		})
		fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
			target: { value: 'password123456' },
		})
		fireEvent.change(screen.getByPlaceholderText('Username'), {
			target: { value: 'chef-ana' },
		})
		fireEvent.click(screen.getByText('Create account'))

		await waitFor(() => {
			expect(mockSignUpWithCredentials).toHaveBeenCalledWith({
				email: 'cook@example.com',
				password: 'password123456',
				confirmPassword: 'password123456',
				username: 'chef-ana',
			})
			expect(mockSignIn).toHaveBeenCalledWith('credentials', {
				email: 'cook@example.com',
				password: 'password123456',
				redirect: false,
				callbackUrl: '/',
			})
		})
	})

	it('does not sign in when account creation fails', async () => {
		mockSignUpWithCredentials.mockResolvedValue({ status: 'email-in-use' })

		renderWithProviders(<CredentialsLogin />)
		fireEvent.click(screen.getByText('Sign up with an email'))
		fireEvent.change(await screen.findByPlaceholderText('Email'), {
			target: { value: 'cook@example.com' },
		})
		fireEvent.change(screen.getByPlaceholderText('Password'), {
			target: { value: 'password123456' },
		})
		fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
			target: { value: 'password123456' },
		})
		fireEvent.change(screen.getByPlaceholderText('Username'), {
			target: { value: 'chef-ana' },
		})
		fireEvent.click(screen.getByText('Create account'))

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(
				'An account already exists with this email',
			)
			expect(mockSignIn).not.toHaveBeenCalled()
		})
	})

	it('shows the legal links on the account creation form', async () => {
		renderWithProviders(<CredentialsLogin />)
		fireEvent.click(screen.getByText('Sign up with an email'))

		expect(await screen.findByText('Terms')).toHaveAttribute('href', '/terms')
		expect(screen.getByText('Privacy Policy')).toHaveAttribute(
			'href',
			'/privacy',
		)
	})

	it('does not call signup when passwords do not match', async () => {
		renderWithProviders(<CredentialsLogin />)
		fireEvent.click(screen.getByText('Sign up with an email'))
		fireEvent.change(await screen.findByPlaceholderText('Email'), {
			target: { value: 'cook@example.com' },
		})
		fireEvent.change(screen.getByPlaceholderText('Password'), {
			target: { value: 'password123456' },
		})
		fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
			target: { value: 'password654321' },
		})
		fireEvent.change(screen.getByPlaceholderText('Username'), {
			target: { value: 'chef-ana' },
		})
		fireEvent.click(screen.getByText('Create account'))

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('Passwords do not match')
			expect(mockSignUpWithCredentials).not.toHaveBeenCalled()
		})
	})
})
