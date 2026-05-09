import { describe, expect, it } from 'vitest'

import { hashPassword, verifyPassword } from './password'

describe('password hashing', () => {
	it('verifies a matching password', async () => {
		const hash = await hashPassword('correct horse battery staple')

		await expect(
			verifyPassword('correct horse battery staple', hash),
		).resolves.toBe(true)
	})

	it('rejects an incorrect password', async () => {
		const hash = await hashPassword('correct horse battery staple')

		await expect(verifyPassword('wrong password', hash)).resolves.toBe(false)
	})

	it('rejects invalid hash formats', async () => {
		await expect(verifyPassword('password', 'invalid')).resolves.toBe(false)
		await expect(verifyPassword('password', null)).resolves.toBe(false)
	})
})
