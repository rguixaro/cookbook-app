/// <reference types="vitest" />
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/env', () => ({
	env: {
		DATABASE_URL: 'postgres://test',
		AUTH_SECRET: 'test-secret',
		NEXTAUTH_SECRET: 'test-secret',
		NEXTAUTH_URL: 'http://localhost:3000',
	},
}))

vi.mock('@/auth', () => ({
	auth: vi.fn(),
	signOut: vi.fn(),
}))

vi.mock('@/server/db', () => ({
	db: {
		user: {
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
		},
		emailVerificationToken: {
			create: vi.fn(),
			deleteMany: vi.fn(),
			findFirst: vi.fn(),
			findUnique: vi.fn(),
			updateMany: vi.fn(),
		},
		passwordResetToken: {
			create: vi.fn(),
			deleteMany: vi.fn(),
			findFirst: vi.fn(),
			findUnique: vi.fn(),
			updateMany: vi.fn(),
		},
		emailChangeToken: {
			create: vi.fn(),
			deleteMany: vi.fn(),
			findFirst: vi.fn(),
			findUnique: vi.fn(),
			updateMany: vi.fn(),
		},
	},
}))

vi.mock('next-intl/server', () => ({
	getLocale: vi.fn().mockResolvedValue('en'),
}))

vi.mock('next/cache', () => ({
	revalidatePath: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
	sendEmailChangedEmail: vi.fn().mockResolvedValue(true),
	sendEmailChangeVerificationEmail: vi.fn().mockResolvedValue(true),
	sendPasswordChangedEmail: vi.fn().mockResolvedValue(true),
	sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
	sendVerificationEmail: vi.fn().mockResolvedValue(true),
	sendWelcomeEmail: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/password', () => ({
	hashPassword: vi.fn(),
	verifyPassword: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
	captureException: vi.fn(),
	captureMessage: vi.fn(),
}))

import { auth, signOut } from '@/auth'
import { DEFAULT_SIGN_OUT_REDIRECT_URL } from '@/routes'
import { db } from '@/server/db'
import {
	sendEmailChangedEmail,
	sendEmailChangeVerificationEmail,
	sendPasswordChangedEmail,
	sendPasswordResetEmail,
	sendVerificationEmail,
	sendWelcomeEmail,
} from '@/lib/email'
import { hashPassword, verifyPassword } from '@/lib/password'
import * as Sentry from '@sentry/nextjs'
import { revalidatePath } from 'next/cache'
import {
	createEmailChangeTokenForUser,
	createPasswordResetTokenForUser,
	hashEmailChangeToken,
	hashPasswordResetToken,
} from '@/server/utils/auth-tokens'
import {
	changePassword,
	requestEmailChange,
	requestEmailVerification,
	requestPasswordReset,
	resetPassword,
	signUpWithCredentials,
	verifyEmailChange,
	verifyEmail,
	handleSignOut,
} from './auth'

const mockAuth = vi.mocked(auth)
const mockSignOut = vi.mocked(signOut)
const mockDb = vi.mocked(db, true)
const mockHashPassword = vi.mocked(hashPassword)
const mockVerifyPassword = vi.mocked(verifyPassword)
const mockSendEmailChangedEmail = vi.mocked(sendEmailChangedEmail)
const mockSendEmailChangeVerificationEmail = vi.mocked(
	sendEmailChangeVerificationEmail,
)
const mockSendPasswordChangedEmail = vi.mocked(sendPasswordChangedEmail)
const mockSendPasswordResetEmail = vi.mocked(sendPasswordResetEmail)
const mockSendVerificationEmail = vi.mocked(sendVerificationEmail)
const mockSendWelcomeEmail = vi.mocked(sendWelcomeEmail)
const mockCaptureException = vi.mocked(Sentry.captureException)
const mockCaptureMessage = vi.mocked(Sentry.captureMessage)
const mockRevalidatePath = vi.mocked(revalidatePath)
const unusedTokenWhere = {
	OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
}

beforeEach(() => {
	vi.clearAllMocks()
	mockDb.emailVerificationToken.deleteMany.mockResolvedValue({
		count: 0,
	} as any)
	mockDb.emailVerificationToken.findFirst.mockResolvedValue(null)
	mockDb.emailVerificationToken.updateMany.mockResolvedValue({
		count: 1,
	} as any)
	mockDb.emailVerificationToken.create.mockResolvedValue({
		id: 'token-1',
	} as any)
	mockDb.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 } as any)
	mockDb.passwordResetToken.findFirst.mockResolvedValue(null)
	mockDb.passwordResetToken.updateMany.mockResolvedValue({ count: 1 } as any)
	mockDb.passwordResetToken.create.mockResolvedValue({ id: 'token-1' } as any)
	mockDb.emailChangeToken.deleteMany.mockResolvedValue({ count: 0 } as any)
	mockDb.emailChangeToken.findFirst.mockResolvedValue(null)
	mockDb.emailChangeToken.findUnique.mockResolvedValue(null)
	mockDb.emailChangeToken.updateMany.mockResolvedValue({ count: 1 } as any)
	mockDb.emailChangeToken.create.mockResolvedValue({ id: 'token-1' } as any)
	mockDb.user.update.mockResolvedValue({ id: 'user-1' } as any)
	mockRevalidatePath.mockImplementation(() => undefined)
})

describe('handleSignOut', () => {
	it('signs out to auth with the homepage as the next login target', async () => {
		await handleSignOut()

		expect(mockSignOut).toHaveBeenCalledWith({
			redirectTo: DEFAULT_SIGN_OUT_REDIRECT_URL,
		})
	})
})

describe('signUpWithCredentials', () => {
	it('rejects invalid signup input', async () => {
		const result = await signUpWithCredentials({
			email: 'invalid',
			password: 'short',
			confirmPassword: 'short',
			username: 'co',
		})

		expect(result).toEqual({ status: 'invalid' })
		expect(mockDb.user.findUnique).not.toHaveBeenCalled()
	})

	it('rejects an existing email address', async () => {
		mockDb.user.findUnique.mockResolvedValue({ id: 'user-1' } as any)

		const result = await signUpWithCredentials({
			email: 'cook@example.com',
			password: 'password123456',
			confirmPassword: 'password123456',
			username: 'cook',
		})

		expect(result).toEqual({ status: 'email-in-use' })
		expect(mockDb.user.create).not.toHaveBeenCalled()
	})

	it('rejects an existing username', async () => {
		mockDb.user.findUnique
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({ id: 'user-1' } as any)

		const result = await signUpWithCredentials({
			email: 'cook@example.com',
			password: 'password123456',
			confirmPassword: 'password123456',
			username: 'cook',
		})

		expect(result).toEqual({ status: 'username-taken' })
		expect(mockDb.user.create).not.toHaveBeenCalled()
	})

	it('rejects mismatched passwords', async () => {
		const result = await signUpWithCredentials({
			email: 'cook@example.com',
			password: 'password123456',
			confirmPassword: 'password654321',
			username: 'cook',
		})

		expect(result).toEqual({ status: 'passwords-do-not-match' })
		expect(mockDb.user.findUnique).not.toHaveBeenCalled()
	})

	it('creates a credentials user and sends welcome with verification', async () => {
		mockDb.user.findUnique.mockResolvedValue(null)
		mockHashPassword.mockResolvedValue('hashed-password')
		mockDb.user.create.mockResolvedValue({ id: 'user-1' } as any)

		const result = await signUpWithCredentials({
			email: 'Cook@Example.com',
			password: 'password123456',
			confirmPassword: 'password123456',
			username: 'Chef-Ana',
		})

		expect(result).toEqual({ status: 'success' })
		expect(mockDb.user.create).toHaveBeenCalledWith({
			data: {
				email: 'cook@example.com',
				name: 'chef-ana',
				username: 'chef-ana',
				passwordHash: 'hashed-password',
				emailVerified: null,
			},
		})
		expect(mockDb.emailVerificationToken.create).toHaveBeenCalledWith({
			data: {
				userId: 'user-1',
				tokenHash: expect.any(String),
				createdAt: expect.any(Date),
				expiresAt: expect.any(Date),
				usedAt: null,
			},
		})
	})

	it('keeps signup successful when welcome email sending fails', async () => {
		mockDb.user.findUnique.mockResolvedValue(null)
		mockHashPassword.mockResolvedValue('hashed-password')
		mockDb.user.create.mockResolvedValue({ id: 'user-1' } as any)
		mockSendWelcomeEmail.mockRejectedValue(new Error('SES failure'))

		const result = await signUpWithCredentials({
			email: 'cook@example.com',
			password: 'password123456',
			confirmPassword: 'password123456',
			username: 'cook',
		})

		expect(result).toEqual({ status: 'success' })
		expect(mockCaptureException).toHaveBeenCalledWith(
			expect.any(Error),
			expect.objectContaining({
				level: 'warning',
				tags: { action: 'signUpWithCredentials', step: 'welcome-email' },
			}),
		)
	})
})

describe('requestEmailVerification', () => {
	it('returns already-verified for verified accounts', async () => {
		mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
		mockDb.user.findUnique.mockResolvedValue({
			id: 'user-1',
			email: 'cook@example.com',
			emailVerified: new Date(),
		} as any)

		const result = await requestEmailVerification()

		expect(result).toEqual({ status: 'already-verified' })
		expect(mockSendVerificationEmail).not.toHaveBeenCalled()
	})
})

describe('verifyEmail', () => {
	it('marks a valid token as verified', async () => {
		mockDb.emailVerificationToken.findUnique.mockResolvedValue({
			id: 'token-1',
			userId: 'user-1',
			expiresAt: new Date(Date.now() + 60_000),
			usedAt: null,
			user: { emailVerified: null },
		} as any)

		const result = await verifyEmail('raw-token')

		expect(result).toEqual({ status: 'success' })
		expect(mockDb.user.update).toHaveBeenCalledWith({
			where: { id: 'user-1' },
			data: { emailVerified: expect.any(Date) },
		})
	})

	it('rejects unknown verification tokens', async () => {
		mockDb.emailVerificationToken.findUnique.mockResolvedValue(null)
		await expect(verifyEmail('raw-token')).resolves.toEqual({
			status: 'invalid',
		})
	})

	it('accepts previously used verification tokens while the user is unverified', async () => {
		mockDb.emailVerificationToken.findUnique.mockResolvedValue({
			id: 'token-1',
			userId: 'user-1',
			expiresAt: new Date(Date.now() + 60_000),
			usedAt: new Date(),
			user: { emailVerified: null },
		} as any)

		await expect(verifyEmail('raw-token')).resolves.toEqual({
			status: 'success',
		})
		expect(mockDb.user.update).toHaveBeenCalledWith({
			where: { id: 'user-1' },
			data: { emailVerified: expect.any(Date) },
		})
	})

	it('treats used verification tokens as success when the user is already verified', async () => {
		mockDb.emailVerificationToken.findUnique.mockResolvedValue({
			id: 'token-1',
			userId: 'user-1',
			expiresAt: new Date(Date.now() + 60_000),
			usedAt: new Date(),
			user: { emailVerified: new Date() },
		} as any)

		await expect(verifyEmail('raw-token')).resolves.toEqual({
			status: 'success',
		})
		expect(mockDb.user.update).not.toHaveBeenCalled()
	})

	it('keeps verification successful when token cleanup fails after updating the user', async () => {
		mockDb.emailVerificationToken.findUnique.mockResolvedValue({
			id: 'token-1',
			userId: 'user-1',
			expiresAt: new Date(Date.now() + 60_000),
			usedAt: null,
			user: { emailVerified: null },
		} as any)
		mockDb.emailVerificationToken.updateMany.mockRejectedValueOnce(
			new Error('cleanup failed'),
		)

		await expect(verifyEmail('raw-token')).resolves.toEqual({
			status: 'success',
		})
		expect(mockCaptureException).toHaveBeenCalledWith(
			expect.any(Error),
			expect.objectContaining({
				level: 'warning',
				tags: { action: 'verifyEmail', step: 'token-cleanup' },
			}),
		)
	})

	it('keeps verification successful when profile revalidation fails after updating the user', async () => {
		mockDb.emailVerificationToken.findUnique.mockResolvedValue({
			id: 'token-1',
			userId: 'user-1',
			expiresAt: new Date(Date.now() + 60_000),
			usedAt: null,
			user: { emailVerified: null },
		} as any)
		mockRevalidatePath.mockImplementationOnce(() => {
			throw new Error('revalidate failed')
		})

		await expect(verifyEmail('raw-token')).resolves.toEqual({
			status: 'success',
		})
		expect(mockCaptureException).toHaveBeenCalledWith(
			expect.any(Error),
			expect.objectContaining({
				level: 'warning',
				tags: { action: 'verifyEmail', step: 'revalidate' },
			}),
		)
	})

	it('returns expired for expired verification tokens', async () => {
		mockDb.emailVerificationToken.findUnique.mockResolvedValue({
			id: 'token-1',
			userId: 'user-1',
			expiresAt: new Date(Date.now() - 60_000),
			usedAt: null,
			user: { emailVerified: null },
		} as any)

		await expect(verifyEmail('raw-token')).resolves.toEqual({
			status: 'expired',
		})
	})
})

describe('requestEmailChange', () => {
	it('rejects invalid input before loading the user', async () => {
		mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)

		await expect(
			requestEmailChange({ email: 'invalid', currentPassword: 'password' }),
		).resolves.toEqual({ status: 'invalid' })
		expect(mockDb.user.findUnique).not.toHaveBeenCalled()
	})

	it('rejects google-only accounts', async () => {
		mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
		mockDb.user.findUnique.mockResolvedValue({
			id: 'user-1',
			email: 'cook@example.com',
			name: 'Cook',
			passwordHash: null,
		} as any)

		await expect(
			requestEmailChange({
				email: 'new@example.com',
				currentPassword: 'password123456',
			}),
		).resolves.toEqual({ status: 'forbidden' })
		expect(mockVerifyPassword).not.toHaveBeenCalled()
	})

	it('rejects an incorrect current password', async () => {
		mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
		mockDb.user.findUnique.mockResolvedValue({
			id: 'user-1',
			email: 'cook@example.com',
			name: 'Cook',
			passwordHash: 'hash',
		} as any)
		mockVerifyPassword.mockResolvedValue(false)

		await expect(
			requestEmailChange({
				email: 'new@example.com',
				currentPassword: 'wrong-password',
			}),
		).resolves.toEqual({ status: 'incorrect-password' })
		expect(mockDb.emailChangeToken.create).not.toHaveBeenCalled()
	})

	it('rejects an email that is already in use', async () => {
		mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
		mockDb.user.findUnique
			.mockResolvedValueOnce({
				id: 'user-1',
				email: 'cook@example.com',
				name: 'Cook',
				passwordHash: 'hash',
			} as any)
			.mockResolvedValueOnce({ id: 'user-2' } as any)
		mockVerifyPassword.mockResolvedValue(true)

		await expect(
			requestEmailChange({
				email: 'New@Example.com',
				currentPassword: 'password123456',
			}),
		).resolves.toEqual({ status: 'email-in-use' })
		expect(mockDb.emailChangeToken.create).not.toHaveBeenCalled()
	})

	it('rate limits repeated pending email change requests', async () => {
		mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
		mockDb.user.findUnique
			.mockResolvedValueOnce({
				id: 'user-1',
				email: 'cook@example.com',
				name: 'Cook',
				passwordHash: 'hash',
			} as any)
			.mockResolvedValueOnce(null)
		mockVerifyPassword.mockResolvedValue(true)
		mockDb.emailChangeToken.findFirst.mockResolvedValue({
			id: 'recent',
		} as any)

		await expect(
			requestEmailChange({
				email: 'new@example.com',
				currentPassword: 'password123456',
			}),
		).resolves.toEqual({ status: 'rate-limited' })
		expect(mockDb.emailChangeToken.create).not.toHaveBeenCalled()
	})
})

describe('createEmailChangeTokenForUser', () => {
	it('stores only the token hash, target email, and consumes older active tokens', async () => {
		const now = new Date('2026-05-09T12:00:00Z')

		const result = await createEmailChangeTokenForUser(
			'user-1',
			'new@example.com',
			now,
		)

		expect(result).not.toBeNull()
		if (!result) return
		expect(result.token).toHaveLength(43)
		expect(result.changePath).toBe(
			`/auth/change-email?token=${encodeURIComponent(result.token)}`,
		)
		expect(mockDb.emailChangeToken.updateMany).toHaveBeenCalledWith({
			where: { userId: 'user-1', ...unusedTokenWhere },
			data: { usedAt: now },
		})
		expect(mockDb.emailChangeToken.create).toHaveBeenCalledWith({
			data: {
				userId: 'user-1',
				newEmail: 'new@example.com',
				tokenHash: hashEmailChangeToken(result.token),
				createdAt: now,
				expiresAt: new Date('2026-05-09T12:30:00Z'),
				usedAt: null,
			},
		})
	})

	it('does not create another token inside the request interval', async () => {
		mockDb.emailChangeToken.findFirst.mockResolvedValue({
			id: 'recent',
		} as any)

		const result = await createEmailChangeTokenForUser(
			'user-1',
			'new@example.com',
		)

		expect(result).toBeNull()
		expect(mockDb.emailChangeToken.create).not.toHaveBeenCalled()
	})
})

describe('verifyEmailChange', () => {
	it('rejects unknown, used, and expired tokens', async () => {
		mockDb.emailChangeToken.findUnique.mockResolvedValueOnce(null)
		await expect(verifyEmailChange('raw-token')).resolves.toEqual({
			status: 'invalid',
		})

		mockDb.emailChangeToken.findUnique.mockResolvedValueOnce({
			id: 'token-1',
			userId: 'user-1',
			newEmail: 'new@example.com',
			expiresAt: new Date(Date.now() + 60_000),
			usedAt: new Date(),
			user: { email: 'old@example.com', name: 'Cook' },
		} as any)
		await expect(verifyEmailChange('raw-token')).resolves.toEqual({
			status: 'invalid',
		})

		mockDb.emailChangeToken.findUnique.mockResolvedValueOnce({
			id: 'token-1',
			userId: 'user-1',
			newEmail: 'new@example.com',
			expiresAt: new Date(Date.now() - 60_000),
			usedAt: null,
			user: { email: 'old@example.com', name: 'Cook' },
		} as any)
		await expect(verifyEmailChange('raw-token')).resolves.toEqual({
			status: 'expired',
		})
	})

	it('rejects a token when another user claimed the email', async () => {
		mockDb.emailChangeToken.findUnique.mockResolvedValue({
			id: 'token-1',
			userId: 'user-1',
			newEmail: 'new@example.com',
			expiresAt: new Date(Date.now() + 60_000),
			usedAt: null,
			user: { email: 'old@example.com', name: 'Cook' },
		} as any)
		mockDb.user.findUnique.mockResolvedValue({ id: 'user-2' } as any)

		await expect(verifyEmailChange('raw-token')).resolves.toEqual({
			status: 'email-in-use',
		})
		expect(mockDb.user.update).not.toHaveBeenCalled()
	})

	it('updates the user email, consumes tokens, and notifies the old email', async () => {
		mockDb.emailChangeToken.findUnique.mockResolvedValue({
			id: 'token-1',
			userId: 'user-1',
			newEmail: 'new@example.com',
			expiresAt: new Date(Date.now() + 60_000),
			usedAt: null,
			user: { email: 'old@example.com', name: 'Cook' },
		} as any)
		mockDb.user.findUnique.mockResolvedValue(null)

		const result = await verifyEmailChange('raw-token')

		expect(result).toEqual({ status: 'success' })
		expect(mockDb.emailChangeToken.findUnique).toHaveBeenCalledWith({
			where: { tokenHash: hashEmailChangeToken('raw-token') },
			select: {
				id: true,
				userId: true,
				newEmail: true,
				expiresAt: true,
				usedAt: true,
				user: { select: { email: true, name: true } },
			},
		})
		expect(mockDb.emailChangeToken.updateMany).toHaveBeenCalledWith({
			where: { id: 'token-1', ...unusedTokenWhere },
			data: { usedAt: expect.any(Date) },
		})
		expect(mockDb.user.update).toHaveBeenCalledWith({
			where: { id: 'user-1' },
			data: {
				email: 'new@example.com',
				emailVerified: expect.any(Date),
			},
		})
		expect(mockDb.emailVerificationToken.updateMany).toHaveBeenCalledWith({
			where: { userId: 'user-1', ...unusedTokenWhere },
			data: { usedAt: expect.any(Date) },
		})
		expect(mockSendEmailChangedEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				recipientEmail: 'old@example.com',
				recipientName: 'Cook',
				newEmail: 'new@example.com',
			}),
		)
	})
})

describe('requestPasswordReset', () => {
	it('validates email syntax and stays neutral for unknown or oauth-only accounts', async () => {
		await expect(requestPasswordReset({ email: 'invalid' })).resolves.toEqual({
			status: 'invalid',
		})
		expect(mockCaptureMessage).toHaveBeenCalledWith(
			'password-reset:request-invalid-input',
			expect.objectContaining({
				level: 'warning',
				extra: expect.objectContaining({ emailDomain: null }),
			}),
		)
		expect(mockDb.user.findUnique).not.toHaveBeenCalled()
		mockCaptureMessage.mockClear()

		mockDb.user.findUnique.mockResolvedValueOnce(null)
		await expect(
			requestPasswordReset({ email: 'missing@example.com' }),
		).resolves.toEqual({ status: 'success' })
		expect(mockCaptureMessage).toHaveBeenCalledWith(
			'password-reset:request-user-not-found',
			expect.objectContaining({
				level: 'info',
				extra: expect.objectContaining({ emailDomain: 'example.com' }),
			}),
		)
		mockCaptureMessage.mockClear()

		mockDb.user.findUnique.mockResolvedValueOnce({
			id: 'user-1',
			email: 'google@example.com',
			passwordHash: null,
		} as any)
		await expect(
			requestPasswordReset({ email: 'google@example.com' }),
		).resolves.toEqual({ status: 'success' })
		expect(mockCaptureMessage).toHaveBeenCalledWith(
			'password-reset:request-oauth-only-account',
			expect.objectContaining({
				level: 'info',
				extra: expect.objectContaining({
					userIdTail: 'user-1',
					emailDomain: 'example.com',
				}),
			}),
		)

		expect(mockSendPasswordResetEmail).not.toHaveBeenCalled()
	})
})

describe('createPasswordResetTokenForUser', () => {
	it('stores only the token hash and returns the raw token for delivery', async () => {
		const now = new Date('2026-05-09T12:00:00Z')

		const result = await createPasswordResetTokenForUser('user-1', now)

		expect(result).not.toBeNull()
		if (!result) return
		expect(result.token).toHaveLength(43)
		expect(result.resetPath).toBe(
			`/auth/reset-password?token=${encodeURIComponent(result.token)}`,
		)

		const createCall = mockDb.passwordResetToken.create.mock.calls[0][0] as any
		expect(createCall.data.tokenHash).toBe(hashPasswordResetToken(result.token))
		expect(createCall.data.tokenHash).not.toBe(result.token)
		expect(createCall.data.expiresAt).toEqual(new Date('2026-05-09T12:30:00Z'))
		expect(createCall.data.usedAt).toBeNull()
	})

	it('does not create another token inside the request interval', async () => {
		mockDb.passwordResetToken.findFirst.mockResolvedValue({
			id: 'recent',
		} as any)

		const result = await createPasswordResetTokenForUser('user-1')

		expect(result).toBeNull()
		expect(mockDb.passwordResetToken.create).not.toHaveBeenCalled()
	})
})

describe('changePassword', () => {
	it('returns validation statuses before loading the user', async () => {
		mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)

		await expect(
			changePassword({
				currentPassword: 'current-password',
				password: 'password123456',
				confirmPassword: 'password654321',
			}),
		).resolves.toEqual({ status: 'passwords-do-not-match' })

		await expect(
			changePassword({
				currentPassword: 'current-password',
				password: 'short',
				confirmPassword: 'short',
			}),
		).resolves.toEqual({ status: 'password-too-short' })

		expect(mockDb.user.findUnique).not.toHaveBeenCalled()
	})

	it('rejects google-only accounts', async () => {
		mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
		mockDb.user.findUnique.mockResolvedValue({
			id: 'user-1',
			email: 'cook@example.com',
			name: 'Cook',
			passwordHash: null,
		} as any)

		await expect(
			changePassword({
				currentPassword: 'current-password',
				password: 'password123456',
				confirmPassword: 'password123456',
			}),
		).resolves.toEqual({ status: 'forbidden' })
		expect(mockVerifyPassword).not.toHaveBeenCalled()
	})

	it('rejects an incorrect current password', async () => {
		mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
		mockDb.user.findUnique.mockResolvedValue({
			id: 'user-1',
			email: 'cook@example.com',
			name: 'Cook',
			passwordHash: 'hash',
		} as any)
		mockVerifyPassword.mockResolvedValue(false)

		await expect(
			changePassword({
				currentPassword: 'wrong-password',
				password: 'password123456',
				confirmPassword: 'password123456',
			}),
		).resolves.toEqual({ status: 'incorrect-password' })
		expect(mockDb.user.update).not.toHaveBeenCalled()
	})

	it('updates the password, revokes sessions, and consumes reset tokens', async () => {
		mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
		mockDb.user.findUnique.mockResolvedValue({
			id: 'user-1',
			email: 'cook@example.com',
			name: 'Cook',
			passwordHash: 'old-hash',
		} as any)
		mockVerifyPassword.mockResolvedValue(true)
		mockHashPassword.mockResolvedValue('new-hash')

		const result = await changePassword({
			currentPassword: 'current-password',
			password: 'password123456',
			confirmPassword: 'password123456',
		})

		expect(result).toEqual({ status: 'success' })
		expect(mockDb.user.update).toHaveBeenCalledWith({
			where: { id: 'user-1' },
			data: {
				passwordHash: 'new-hash',
				passwordChangedAt: expect.any(Date),
				sessionVersion: { increment: 1 },
			},
		})
		expect(mockDb.passwordResetToken.updateMany).toHaveBeenCalledWith({
			where: { userId: 'user-1', ...unusedTokenWhere },
			data: { usedAt: expect.any(Date) },
		})
		expect(mockSendPasswordChangedEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				recipientEmail: 'cook@example.com',
				recipientName: 'Cook',
			}),
		)
	})
})

describe('resetPassword', () => {
	it('rejects mismatched passwords before looking up a token', async () => {
		const result = await resetPassword({
			token: 'a'.repeat(43),
			password: 'password123456',
			confirmPassword: 'password654321',
		})

		expect(result).toEqual({ status: 'passwords-do-not-match' })
		expect(mockDb.passwordResetToken.findUnique).not.toHaveBeenCalled()
	})

	it('returns password-specific errors before looking up a token', async () => {
		await expect(
			resetPassword({
				token: 'a'.repeat(43),
				password: 'short',
				confirmPassword: 'short',
			}),
		).resolves.toEqual({ status: 'password-too-short' })

		await expect(
			resetPassword({
				token: 'a'.repeat(43),
				password: 'a'.repeat(129),
				confirmPassword: 'a'.repeat(129),
			}),
		).resolves.toEqual({ status: 'password-too-long' })

		expect(mockDb.passwordResetToken.findUnique).not.toHaveBeenCalled()
		expect(mockDb.passwordResetToken.updateMany).not.toHaveBeenCalled()
	})

	it('rejects missing tokens and expires expired tokens', async () => {
		const token = 'a'.repeat(43)
		mockDb.passwordResetToken.findUnique.mockResolvedValue(null)
		await expect(
			resetPassword({
				token,
				password: 'password123456',
				confirmPassword: 'password123456',
			}),
		).resolves.toEqual({ status: 'invalid' })
		expect(mockCaptureMessage).toHaveBeenCalledWith(
			'password-reset:reset-token-not-found',
			expect.objectContaining({
				level: 'warning',
				extra: expect.objectContaining({
					tokenLength: 43,
					tokenHashPrefix: hashPasswordResetToken(token).slice(0, 12),
				}),
			}),
		)
		mockCaptureMessage.mockClear()

		mockDb.passwordResetToken.findUnique.mockResolvedValue({
			id: 'token-1',
			userId: 'user-1',
			createdAt: new Date(Date.now() - 120_000),
			expiresAt: new Date(Date.now() - 60_000),
			usedAt: null,
			user: { emailVerified: null, passwordChangedAt: null },
		} as any)
		await expect(
			resetPassword({
				token: 'a'.repeat(43),
				password: 'password123456',
				confirmPassword: 'password123456',
			}),
		).resolves.toEqual({ status: 'expired' })
		expect(mockCaptureMessage).toHaveBeenCalledWith(
			'password-reset:reset-token-expired',
			expect.objectContaining({
				level: 'warning',
				extra: expect.objectContaining({
					resetTokenIdTail: 'oken-1',
					userIdTail: 'user-1',
					tokenLength: 43,
				}),
			}),
		)
	})

	it('updates the password, consumes the token, and verifies email', async () => {
		const token = 'a'.repeat(43)
		mockHashPassword.mockResolvedValue('new-hash')
		mockDb.passwordResetToken.findUnique.mockResolvedValue({
			id: 'token-1',
			userId: 'user-1',
			expiresAt: new Date(Date.now() + 60_000),
			usedAt: null,
			user: { emailVerified: null, passwordChangedAt: null },
		} as any)

		const result = await resetPassword({
			token,
			password: 'password123456',
			confirmPassword: 'password123456',
		})

		expect(result).toEqual({ status: 'success' })
		expect(mockDb.passwordResetToken.findUnique).toHaveBeenCalledWith({
			where: { tokenHash: hashPasswordResetToken(token) },
			select: {
				id: true,
				userId: true,
				createdAt: true,
				expiresAt: true,
				usedAt: true,
				user: { select: { emailVerified: true, passwordChangedAt: true } },
			},
		})
		expect(mockDb.passwordResetToken.updateMany).toHaveBeenCalledWith({
			where: { id: 'token-1', ...unusedTokenWhere },
			data: { usedAt: expect.any(Date) },
		})
		expect(mockDb.user.update).toHaveBeenCalledWith({
			where: { id: 'user-1' },
			data: {
				passwordHash: 'new-hash',
				passwordChangedAt: expect.any(Date),
				sessionVersion: { increment: 1 },
				emailVerified: expect.any(Date),
			},
		})
		expect(mockCaptureMessage).toHaveBeenCalledWith(
			'password-reset:reset-success',
			expect.objectContaining({
				level: 'info',
				extra: expect.objectContaining({
					resetTokenIdTail: 'oken-1',
					userIdTail: 'user-1',
					tokenLength: 43,
					tokenHashPrefix: hashPasswordResetToken(token).slice(0, 12),
					consumeCount: 1,
				}),
			}),
		)
	})

	it('returns success for an already-used token when the password change completed', async () => {
		const usedAt = new Date('2026-05-09T12:00:00Z')
		mockDb.passwordResetToken.findUnique.mockResolvedValue({
			id: 'token-1',
			userId: 'user-1',
			expiresAt: new Date(Date.now() + 60_000),
			usedAt,
			user: { emailVerified: true, passwordChangedAt: usedAt },
		} as any)

		await expect(
			resetPassword({
				token: 'a'.repeat(43),
				password: 'password123456',
				confirmPassword: 'password123456',
			}),
		).resolves.toEqual({ status: 'success' })
		expect(mockDb.user.update).not.toHaveBeenCalled()
		expect(mockCaptureMessage).toHaveBeenCalledWith(
			'password-reset:reset-token-already-completed',
			expect.objectContaining({
				level: 'info',
				extra: expect.objectContaining({
					resetTokenIdTail: 'oken-1',
					userIdTail: 'user-1',
				}),
			}),
		)
	})

	it('returns success when a concurrent reset already consumed and completed the same token', async () => {
		const usedAt = new Date('2026-05-09T12:00:00Z')
		mockHashPassword.mockResolvedValue('new-hash')
		mockDb.passwordResetToken.findUnique
			.mockResolvedValueOnce({
				id: 'token-1',
				userId: 'user-1',
				expiresAt: new Date(Date.now() + 60_000),
				usedAt: null,
				user: { emailVerified: true, passwordChangedAt: null },
			} as any)
			.mockResolvedValueOnce({
				usedAt,
				user: { passwordChangedAt: usedAt },
			} as any)
		mockDb.passwordResetToken.updateMany.mockResolvedValueOnce({
			count: 0,
		} as any)

		await expect(
			resetPassword({
				token: 'a'.repeat(43),
				password: 'password123456',
				confirmPassword: 'password123456',
			}),
		).resolves.toEqual({ status: 'success' })
		expect(mockDb.user.update).not.toHaveBeenCalled()
		expect(mockCaptureMessage).toHaveBeenCalledWith(
			'password-reset:reset-token-consume-race',
			expect.objectContaining({
				level: 'warning',
				extra: expect.objectContaining({
					consumeCount: 0,
					resetTokenIdTail: 'oken-1',
				}),
			}),
		)
		expect(mockCaptureMessage).toHaveBeenCalledWith(
			'password-reset:reset-token-consume-race-result',
			expect.objectContaining({
				level: 'warning',
				extra: expect.objectContaining({
					resultStatus: 'success',
					resetTokenIdTail: 'oken-1',
				}),
			}),
		)
	})

	it('rejects an already-used token when no password change completed', async () => {
		mockDb.passwordResetToken.findUnique.mockResolvedValue({
			id: 'token-1',
			userId: 'user-1',
			expiresAt: new Date(Date.now() + 60_000),
			usedAt: new Date(),
			user: { emailVerified: null, passwordChangedAt: null },
		} as any)

		await expect(
			resetPassword({
				token: 'a'.repeat(43),
				password: 'password123456',
				confirmPassword: 'password123456',
			}),
		).resolves.toEqual({ status: 'invalid' })
		expect(mockDb.user.update).not.toHaveBeenCalled()
		expect(mockCaptureMessage).toHaveBeenCalledWith(
			'password-reset:reset-token-used-incomplete',
			expect.objectContaining({
				level: 'warning',
				extra: expect.objectContaining({
					resetTokenIdTail: 'oken-1',
					userIdTail: 'user-1',
					hasPasswordChangedAt: false,
				}),
			}),
		)
	})
})
