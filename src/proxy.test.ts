/// <reference types="vitest" />
import { describe, expect, it, vi } from 'vitest'

vi.mock('next-auth', () => ({
	default: vi.fn(() => ({
		auth: (handler: (req: RequestWithAuth) => unknown) => handler,
	})),
}))

vi.mock('@/auth.config', () => ({ default: {} }))

vi.mock('./utils/crawlers', () => ({
	isCrawlerUserAgent: vi.fn(() => false),
}))

import proxy from './proxy'

type RequestWithAuth = {
	nextUrl: URL
	auth: unknown
	headers: Headers
}

function createRequest(path: string, auth: unknown = null): RequestWithAuth {
	return {
		nextUrl: new URL(path, 'http://localhost:3000'),
		auth,
		headers: new Headers({ 'user-agent': 'Mozilla/5.0' }),
	}
}

describe('proxy auth redirects', () => {
	it('preserves a direct unauthenticated profile URL as the login callback', async () => {
		const response = await proxy(createRequest('/profile'))

		expect(response?.headers.get('location')).toBe(
			'http://localhost:3000/auth?callbackUrl=%2Fprofile',
		)
	})

	it('preserves direct unauthenticated recipe URLs with query state', async () => {
		const response = await proxy(
			createRequest(
				'/recipes/chef/pasta-carbonara?referred=true&search=olga&recipeSearch=pasta',
			),
		)

		expect(response?.headers.get('location')).toBe(
			'http://localhost:3000/auth?callbackUrl=%2Frecipes%2Fchef%2Fpasta-carbonara%3Freferred%3Dtrue%26search%3Dolga%26recipeSearch%3Dpasta',
		)
	})

	it('protects the discover index route', async () => {
		const response = await proxy(createRequest('/discover'))

		expect(response?.headers.get('location')).toBe(
			'http://localhost:3000/auth?callbackUrl=%2Fdiscover',
		)
	})

	it('protects discover recipe URLs with query state', async () => {
		const response = await proxy(
			createRequest('/discover/tortilla-de-patatas?search=potato'),
		)

		expect(response?.headers.get('location')).toBe(
			'http://localhost:3000/auth?callbackUrl=%2Fdiscover%2Ftortilla-de-patatas%3Fsearch%3Dpotato',
		)
	})
})
