import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test.describe('Auth page', () => {
	test('renders the login page with correct title', async ({ page }) => {
		await page.goto('/auth')

		await expect(page).toHaveTitle(/Sign In.*CookBook/)
	})

	test('displays the Google sign-in button', async ({ page }) => {
		await page.goto('/auth')

		const googleButton = page.getByText('Continue with Google')
		await expect(googleButton).toBeVisible()
		await expect(page.getByRole('link', { name: 'Terms' })).toHaveAttribute(
			'href',
			'/terms',
		)
		await expect(
			page.getByRole('link', { name: 'Privacy Policy' }),
		).toHaveAttribute('href', '/privacy')
	})

	test('displays email sign-in controls', async ({ page }) => {
		await page.goto('/auth')

		const emailLoginOption = page.getByRole('button', { name: 'Login' })
		await expect(emailLoginOption).toBeVisible()
		await expect(page.getByPlaceholder('Email')).toBeHidden()

		await emailLoginOption.click()

		await expect(page.getByText('Continue with Google')).toBeVisible()
		await expect(page.getByRole('link', { name: 'Terms' })).toHaveAttribute(
			'href',
			'/terms',
		)
		await expect(
			page.getByRole('link', { name: 'Privacy Policy' }),
		).toHaveAttribute('href', '/privacy')
		await expect(
			page.getByRole('link', { name: 'Forgot password?' }),
		).toHaveAttribute('href', '/auth/forgot-password')
		await expect(page.getByPlaceholder('Email')).toBeVisible()
		await expect(
			page.getByPlaceholder('Password', { exact: true }),
		).toBeVisible()
		await expect(page.getByText('Sign in with email')).toBeVisible()
	})

	test('displays account creation controls with legal links', async ({ page }) => {
		await page.goto('/auth')

		await page.getByText('Sign up with an email').click()

		await expect(page.getByText('Continue with Google')).toBeVisible()
		await expect(page.getByPlaceholder('Email')).toBeVisible()
		await expect(
			page.getByPlaceholder('Password', { exact: true }),
		).toBeVisible()
		await expect(page.getByPlaceholder('Confirm password')).toBeVisible()
		await expect(page.getByPlaceholder('Username')).toBeVisible()
		await expect(page.getByRole('link', { name: 'Terms' })).toHaveAttribute(
			'href',
			'/terms',
		)
		await expect(
			page.getByRole('link', { name: 'Privacy Policy' }),
		).toHaveAttribute('href', '/privacy')
	})

	test('navigates to legal pages from account creation links', async ({
		page,
	}) => {
		await page.goto('/auth')
		await page.getByText('Sign up with an email').click()
		const termsLink = page.getByRole('link', { name: 'Terms' })
		await expect(termsLink).toHaveAttribute('href', '/terms')
		await Promise.all([page.waitForURL(/\/terms$/), termsLink.click()])
		await expect(
			page.getByRole('heading', { name: 'Terms of Service' }),
		).toBeVisible()

		await page.goto('/auth')
		await page.getByText('Sign up with an email').click()
		const privacyLink = page.getByRole('link', { name: 'Privacy Policy' })
		await expect(privacyLink).toHaveAttribute('href', '/privacy')
		await Promise.all([page.waitForURL(/\/privacy$/), privacyLink.click()])
		await expect(
			page.getByRole('heading', { name: 'Privacy Policy' }),
		).toBeVisible()
	})

	test('displays the app branding', async ({ page }) => {
		await page.goto('/auth')

		await expect(page.getByText('Cookbook', { exact: true })).toBeVisible()
	})

	test('navigates to the forgot password page from email login', async ({
		page,
	}) => {
		await page.goto('/auth')
		await page.getByRole('button', { name: 'Login' }).click()
		await page.getByRole('link', { name: 'Forgot password?' }).click()

		await expect(page).toHaveURL(/\/auth\/forgot-password$/)
		await expect(
			page.getByRole('heading', { name: 'Reset your password' }),
		).toBeVisible()
	})
})

test.describe('Auth error page', () => {
	test('renders error page with return link', async ({ page }) => {
		await page.goto('/auth/error')

		await expect(page).toHaveTitle(/Authentication Error.*CookBook/)
		await expect(page.getByText('An error occurred')).toBeVisible()
		await expect(page.getByText('Return')).toBeVisible()
	})

	test('return link navigates back', async ({ page }) => {
		await page.goto('/auth/error')

		await page.getByText('Return').click()
		await page.waitForURL('**/*')
	})
})

test.describe('Legal pages', () => {
	test('privacy policy loads unauthenticated', async ({ page }) => {
		await page.goto('/privacy')

		await expect(page).toHaveTitle(/Privacy Policy.*CookBook/)
		await expect(
			page.getByRole('heading', { name: 'Privacy Policy' }),
		).toBeVisible()
		await expect(page.getByText('privacy@rguixaro.dev').first()).toBeVisible()
	})

	test('terms of service loads unauthenticated', async ({ page }) => {
		await page.goto('/terms')

		await expect(page).toHaveTitle(/Terms of Service.*CookBook/)
		await expect(
			page.getByRole('heading', { name: 'Terms of Service' }),
		).toBeVisible()
		await expect(page.getByText('at least 16 years old')).toBeVisible()
	})
})

test.describe('Password reset pages', () => {
	test('forgot password loads unauthenticated', async ({ page }) => {
		await page.goto('/auth/forgot-password')

		await expect(page).toHaveTitle(/Forgot Password.*CookBook/)
		await expect(
			page.getByRole('heading', { name: 'Reset your password' }),
		).toBeVisible()
		await expect(page.getByPlaceholder('Email')).toBeVisible()
	})

	test('reset password without a token shows an invalid link state', async ({
		page,
	}) => {
		await page.goto('/auth/reset-password')

		await expect(page).toHaveTitle(/Reset Password.*CookBook/)
		await expect(
			page.getByRole('heading', { name: 'Invalid reset link' }),
		).toBeVisible()
		await expect(
			page.getByRole('link', { name: 'Request a new link' }),
		).toHaveAttribute('href', '/auth/forgot-password')
	})
})
