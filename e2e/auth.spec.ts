import { test, expect } from '@playwright/test'

test.describe('Auth page', () => {
	test('renders the login page with correct title', async ({ page }) => {
		await page.goto('/auth')

		await expect(page).toHaveTitle(/Sign In.*CookBook/)
	})

	test('displays the Google sign-in button', async ({ page }) => {
		await page.goto('/auth')

		const googleButton = page.getByText('Continue with Google')
		await expect(googleButton).toBeVisible()
	})

	test('displays the app branding', async ({ page }) => {
		await page.goto('/auth')

		await expect(page.getByText('Cookbook', { exact: true })).toBeVisible()
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
