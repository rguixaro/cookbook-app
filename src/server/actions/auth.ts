'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { getLocale } from 'next-intl/server'
import * as Sentry from '@sentry/nextjs'

import { auth, signOut } from '@/auth'
import {
	type EmailLocale,
	sendEmailChangedEmail,
	sendEmailChangeVerificationEmail,
	sendPasswordChangedEmail,
	sendPasswordResetEmail,
	sendVerificationEmail,
	sendWelcomeEmail,
} from '@/lib/email'
import { hashPassword, verifyPassword } from '@/lib/password'
import { env } from '@/env.mjs'
import { db } from '@/server/db'
import { DEFAULT_SIGN_OUT_REDIRECT_URL } from '@/routes'
import {
	ChangePasswordSchema,
	CredentialsSignUpSchema,
	PasswordResetRequestSchema,
	PasswordResetSchema,
	RequestEmailChangeSchema,
} from '@/server/schemas'
import {
	createEmailChangeTokenForUser,
	createEmailVerificationTokenForUser,
	createPasswordResetTokenForUser,
	hashEmailChangeToken,
	hashEmailVerificationToken,
	hashPasswordResetToken,
} from '@/server/utils/auth-tokens'

type CredentialsSignUpResult =
	| { status: 'success' }
	| {
			status:
				| 'invalid'
				| 'passwords-do-not-match'
				| 'email-in-use'
				| 'username-taken'
				| 'error'
	  }

type PasswordResetRequestResult = { status: 'success' } | { status: 'invalid' }

type PasswordResetResult =
	| { status: 'success' }
	| {
			status:
				| 'invalid'
				| 'expired'
				| 'passwords-do-not-match'
				| 'password-too-short'
				| 'password-too-long'
				| 'error'
	  }

type EmailVerificationRequestResult =
	| { status: 'sent' }
	| { status: 'already-verified' }
	| { status: 'error' }

type EmailVerificationResult =
	| { status: 'success' }
	| { status: 'invalid' | 'expired' }

type EmailChangeRequestResult =
	| { status: 'sent' }
	| {
			status:
				| 'invalid'
				| 'forbidden'
				| 'incorrect-password'
				| 'email-in-use'
				| 'rate-limited'
				| 'error'
	  }

type EmailChangeResult =
	| { status: 'success' }
	| { status: 'invalid' | 'expired' | 'email-in-use' }

type ChangePasswordResult =
	| { status: 'success' }
	| {
			status:
				| 'invalid'
				| 'forbidden'
				| 'incorrect-password'
				| 'password-too-short'
				| 'password-too-long'
				| 'passwords-do-not-match'
				| 'error'
	  }

/**
 * Sign out
 * @returns Promise<void>
 */
export const handleSignOut = async () => {
	await signOut({ redirectTo: DEFAULT_SIGN_OUT_REDIRECT_URL })
}

export const signUpWithCredentials = async (
	values: unknown,
): Promise<CredentialsSignUpResult> => {
	const parsed = CredentialsSignUpSchema.safeParse(values)
	if (!parsed.success) {
		const firstMessage = parsed.error.issues[0]?.message
		if (firstMessage === 'passwords-do-not-match') {
			return { status: 'passwords-do-not-match' }
		}
		return { status: 'invalid' }
	}

	const { email, password, username } = parsed.data

	try {
		const existingUser = await db.user.findUnique({ where: { email } })
		if (existingUser) return { status: 'email-in-use' }

		const existingUsername = await db.user.findUnique({ where: { username } })
		if (existingUsername) return { status: 'username-taken' }

		const passwordHash = await hashPassword(password)
		const user = await db.user.create({
			data: {
				email,
				name: username,
				username,
				passwordHash,
				emailVerified: null,
			},
		})

		try {
			const token = await createEmailVerificationTokenForUser(user.id)
			if (!token) return { status: 'success' }
			const locale = await getActionLocale()
			await sendWelcomeEmail({
				recipientEmail: email,
				recipientName: username,
				verificationUrl: buildAppUrl(token.verificationPath),
				locale,
			})
		} catch (error) {
			Sentry.captureException(error, {
				level: 'warning',
				tags: { action: 'signUpWithCredentials', step: 'welcome-email' },
			})
		}

		return { status: 'success' }
	} catch (error) {
		if (isUniqueConstraintOn(error, 'email')) return { status: 'email-in-use' }
		if (isUniqueConstraintOn(error, 'username')) {
			return { status: 'username-taken' }
		}

		Sentry.captureException(error, {
			tags: { action: 'signUpWithCredentials' },
		})
		return { status: 'error' }
	}
}

export const requestPasswordReset = async (
	values: unknown,
): Promise<PasswordResetRequestResult> => {
	const parsed = PasswordResetRequestSchema.safeParse(values)
	if (!parsed.success) {
		await logPasswordResetEvent('request-invalid-input', 'warning', {
			emailDomain: getEmailDomainFromUnknown(values),
			issueMessages: parsed.error.issues.map((issue) => issue.message),
		})
		return { status: 'invalid' }
	}

	try {
		const user = await db.user.findUnique({
			where: { email: parsed.data.email },
			select: { id: true, email: true, name: true, passwordHash: true },
		})

		if (!user) {
			await logPasswordResetEvent('request-user-not-found', 'info', {
				emailDomain: getEmailDomain(parsed.data.email),
			})
			return { status: 'success' }
		}

		if (!user.passwordHash) {
			await logPasswordResetEvent('request-oauth-only-account', 'info', {
				userIdTail: getIdTail(user.id),
				emailDomain: getEmailDomain(user.email),
			})
			return { status: 'success' }
		}

		if (user?.passwordHash) {
			const token = await createPasswordResetTokenForUser(user.id)
			if (!token) {
				await logPasswordResetEvent('request-rate-limited', 'info', {
					userIdTail: getIdTail(user.id),
					emailDomain: getEmailDomain(user.email),
				})
				return { status: 'success' }
			}

			const locale = await getActionLocale()
			const sent = await sendPasswordResetEmail({
				recipientEmail: user.email,
				recipientName: user.name || user.email,
				resetUrl: buildAppUrl(token.resetPath),
				locale,
			})
			await logPasswordResetEvent('request-token-created', 'info', {
				userIdTail: getIdTail(user.id),
				emailDomain: getEmailDomain(user.email),
				expiresAt: toIsoString(token.expiresAt),
				emailSendAttempted: true,
				emailSent: sent,
			})
		}

		return { status: 'success' }
	} catch (error) {
		await logPasswordResetEvent('request-exception', 'error')
		Sentry.captureException(error, {
			tags: { action: 'requestPasswordReset' },
		})
		return { status: 'success' }
	}
}

export const resetPassword = async (
	values: unknown,
): Promise<PasswordResetResult> => {
	const parsed = PasswordResetSchema.safeParse(values)
	if (!parsed.success) {
		const messages = new Set(parsed.error.issues.map((issue) => issue.message))
		await logPasswordResetEvent('reset-schema-invalid', 'warning', {
			...getTokenMetadataFromUnknown(values),
			issueMessages: Array.from(messages),
		})
		if (messages.has('passwords-do-not-match')) {
			return { status: 'passwords-do-not-match' }
		}
		if (messages.has('password-too-short')) {
			return { status: 'password-too-short' }
		}
		if (messages.has('password-too-long')) {
			return { status: 'password-too-long' }
		}
		return { status: 'invalid' }
	}

	const now = new Date()
	const { token, password } = parsed.data
	const tokenMetadata = getTokenMetadata(token)

	try {
		const resetToken = await db.passwordResetToken.findUnique({
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

		if (!resetToken) {
			await logPasswordResetEvent('reset-token-not-found', 'warning', {
				...tokenMetadata,
			})
			return { status: 'invalid' }
		}

		const resetTokenMetadata = {
			...tokenMetadata,
			resetTokenIdTail: getIdTail(resetToken.id),
			userIdTail: getIdTail(resetToken.userId),
			createdAt: toIsoString(resetToken.createdAt),
			expiresAt: toIsoString(resetToken.expiresAt),
			expiresInMs: resetToken.expiresAt.getTime() - now.getTime(),
			usedAt: toIsoString(resetToken.usedAt),
			passwordChangedAt: toIsoString(resetToken.user.passwordChangedAt),
			hasPasswordChangedAt: Boolean(resetToken.user.passwordChangedAt),
		}

		if (resetToken.usedAt) {
			const passwordChangedAt = resetToken.user.passwordChangedAt
			if (
				passwordChangedAt &&
				passwordChangedAt.getTime() >= resetToken.usedAt.getTime()
			) {
				await logPasswordResetEvent(
					'reset-token-already-completed',
					'info',
					{
						...resetTokenMetadata,
					},
				)
				return { status: 'success' }
			}

			await logPasswordResetEvent('reset-token-used-incomplete', 'warning', {
				...resetTokenMetadata,
			})
			return { status: 'invalid' }
		}

		if (resetToken.expiresAt.getTime() <= now.getTime()) {
			await logPasswordResetEvent('reset-token-expired', 'warning', {
				...resetTokenMetadata,
			})
			return { status: 'expired' }
		}

		const passwordHash = await hashPassword(password)
		const completedAt = new Date()

		const consumed = await db.passwordResetToken.updateMany({
			where: {
				id: resetToken.id,
				OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
			},
			data: { usedAt: completedAt },
		})

		if (consumed.count !== 1) {
			await logPasswordResetEvent('reset-token-consume-race', 'warning', {
				...resetTokenMetadata,
				consumeCount: consumed.count,
			})
			const raceResult = await getUsedPasswordResetTokenStatus(resetToken.id)
			await logPasswordResetEvent(
				'reset-token-consume-race-result',
				'warning',
				{
					...resetTokenMetadata,
					resultStatus: raceResult.status,
				},
			)
			return raceResult
		}

		await db.user.update({
			where: { id: resetToken.userId },
			data: {
				passwordHash,
				passwordChangedAt: completedAt,
				sessionVersion: { increment: 1 },
				...(resetToken.user.emailVerified
					? {}
					: { emailVerified: completedAt }),
			},
		})

		try {
			await db.passwordResetToken.updateMany({
				where: {
					userId: resetToken.userId,
					id: { not: resetToken.id },
					OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
				},
				data: { usedAt: completedAt },
			})
		} catch (error) {
			Sentry.captureException(error, {
				level: 'warning',
				tags: { action: 'resetPassword', step: 'token-cleanup' },
			})
		}

		await logPasswordResetEvent('reset-success', 'info', {
			...resetTokenMetadata,
			completedAt: toIsoString(completedAt),
			consumeCount: consumed.count,
		})
		return { status: 'success' }
	} catch (error) {
		await logPasswordResetEvent('reset-exception', 'error', {
			...tokenMetadata,
		})
		Sentry.captureException(error, {
			tags: { action: 'resetPassword' },
		})
		return { status: 'error' }
	}
}

async function getUsedPasswordResetTokenStatus(
	tokenId: string,
): Promise<PasswordResetResult> {
	for (let attempt = 0; attempt < 3; attempt++) {
		const token = await db.passwordResetToken.findUnique({
			where: { id: tokenId },
			select: {
				usedAt: true,
				user: { select: { passwordChangedAt: true } },
			},
		})

		const usedAt = token?.usedAt
		const passwordChangedAt = token?.user.passwordChangedAt
		if (
			usedAt &&
			passwordChangedAt &&
			passwordChangedAt.getTime() >= usedAt.getTime()
		) {
			return { status: 'success' }
		}

		if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 150))
	}

	return { status: 'invalid' }
}

export const requestEmailVerification =
	async (): Promise<EmailVerificationRequestResult> => {
		const currentUser = await auth()
		if (!currentUser) return { status: 'error' }

		try {
			const user = await db.user.findUnique({
				where: { id: currentUser.user.id },
				select: { id: true, email: true, name: true, emailVerified: true },
			})

			if (!user?.email) return { status: 'error' }
			if (user.emailVerified) return { status: 'already-verified' }

			const token = await createEmailVerificationTokenForUser(
				user.id,
				new Date(),
				true,
			)
			if (!token) return { status: 'sent' }

			const locale = await getActionLocale()
			const sent = await sendVerificationEmail({
				recipientEmail: user.email,
				recipientName: user.name || user.email,
				verificationUrl: buildAppUrl(token.verificationPath),
				locale,
			})

			return sent ? { status: 'sent' } : { status: 'error' }
		} catch (error) {
			Sentry.captureException(error, {
				tags: { action: 'requestEmailVerification' },
			})
			return { status: 'error' }
		}
	}

export const requestEmailChange = async (
	values: unknown,
): Promise<EmailChangeRequestResult> => {
	const currentUser = await auth()
	if (!currentUser) return { status: 'forbidden' }

	const parsed = RequestEmailChangeSchema.safeParse(values)
	if (!parsed.success) return { status: 'invalid' }

	const { email: newEmail, currentPassword } = parsed.data

	try {
		const user = await db.user.findUnique({
			where: { id: currentUser.user.id },
			select: {
				id: true,
				email: true,
				name: true,
				passwordHash: true,
			},
		})

		if (!user?.passwordHash) return { status: 'forbidden' }
		if (newEmail === user.email) return { status: 'email-in-use' }

		const isPasswordValid = await verifyPassword(
			currentPassword,
			user.passwordHash,
		)
		if (!isPasswordValid) return { status: 'incorrect-password' }

		const existingUser = await db.user.findUnique({
			where: { email: newEmail },
			select: { id: true },
		})
		if (existingUser) return { status: 'email-in-use' }

		const token = await createEmailChangeTokenForUser(user.id, newEmail)
		if (!token) return { status: 'rate-limited' }

		const locale = await getActionLocale()
		const sent = await sendEmailChangeVerificationEmail({
			recipientEmail: newEmail,
			recipientName: user.name || user.email,
			verificationUrl: buildAppUrl(token.changePath),
			locale,
		})

		return sent ? { status: 'sent' } : { status: 'error' }
	} catch (error) {
		Sentry.captureException(error, { tags: { action: 'requestEmailChange' } })
		return { status: 'error' }
	}
}

export const verifyEmailChange = async (
	token: string,
): Promise<EmailChangeResult> => {
	const trimmedToken = token.trim()
	if (!trimmedToken) return { status: 'invalid' }

	const now = new Date()

	try {
		const emailChangeToken = await db.emailChangeToken.findUnique({
			where: { tokenHash: hashEmailChangeToken(trimmedToken) },
			select: {
				id: true,
				userId: true,
				newEmail: true,
				expiresAt: true,
				usedAt: true,
				user: { select: { email: true, name: true } },
			},
		})

		if (!emailChangeToken || emailChangeToken.usedAt) {
			return { status: 'invalid' }
		}

		if (emailChangeToken.expiresAt.getTime() <= now.getTime()) {
			return { status: 'expired' }
		}

		const existingUser = await db.user.findUnique({
			where: { email: emailChangeToken.newEmail },
			select: { id: true },
		})
		if (existingUser && existingUser.id !== emailChangeToken.userId) {
			return { status: 'email-in-use' }
		}

		const consumed = await db.emailChangeToken.updateMany({
			where: {
				id: emailChangeToken.id,
				OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
			},
			data: { usedAt: now },
		})

		if (consumed.count !== 1) return { status: 'invalid' }

		await db.user.update({
			where: { id: emailChangeToken.userId },
			data: {
				email: emailChangeToken.newEmail,
				emailVerified: now,
			},
		})

		await Promise.all([
			db.emailChangeToken.updateMany({
				where: {
					userId: emailChangeToken.userId,
					id: { not: emailChangeToken.id },
					OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
				},
				data: { usedAt: now },
			}),
			db.emailVerificationToken.updateMany({
				where: {
					userId: emailChangeToken.userId,
					OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
				},
				data: { usedAt: now },
			}),
		]).catch((error) =>
			Sentry.captureException(error, {
				level: 'warning',
				tags: { action: 'verifyEmailChange', step: 'token-cleanup' },
			}),
		)

		const locale = await getActionLocale()
		await sendEmailChangedEmail({
			recipientEmail: emailChangeToken.user.email,
			recipientName: emailChangeToken.user.name || emailChangeToken.user.email,
			newEmail: emailChangeToken.newEmail,
			locale,
		}).catch((error) =>
			Sentry.captureException(error, {
				level: 'warning',
				tags: { action: 'verifyEmailChange', step: 'notification-email' },
			}),
		)

		try {
			revalidatePath('/profile')
			revalidatePath('/profiles', 'layout')
		} catch (error) {
			Sentry.captureException(error, {
				level: 'warning',
				tags: { action: 'verifyEmailChange', step: 'revalidate' },
			})
		}

		return { status: 'success' }
	} catch (error) {
		if (isUniqueConstraintOn(error, 'email')) {
			return { status: 'email-in-use' }
		}

		Sentry.captureException(error, { tags: { action: 'verifyEmailChange' } })
		return { status: 'invalid' }
	}
}

export const changePassword = async (
	values: unknown,
): Promise<ChangePasswordResult> => {
	const currentUser = await auth()
	if (!currentUser) return { status: 'forbidden' }

	const parsed = ChangePasswordSchema.safeParse(values)
	if (!parsed.success) {
		const messages = new Set(parsed.error.issues.map((issue) => issue.message))
		if (messages.has('passwords-do-not-match')) {
			return { status: 'passwords-do-not-match' }
		}
		if (messages.has('password-too-short')) {
			return { status: 'password-too-short' }
		}
		if (messages.has('password-too-long')) {
			return { status: 'password-too-long' }
		}
		return { status: 'invalid' }
	}

	const { currentPassword, password } = parsed.data

	try {
		const user = await db.user.findUnique({
			where: { id: currentUser.user.id },
			select: {
				id: true,
				email: true,
				name: true,
				passwordHash: true,
			},
		})

		if (!user?.passwordHash) return { status: 'forbidden' }

		const isPasswordValid = await verifyPassword(
			currentPassword,
			user.passwordHash,
		)
		if (!isPasswordValid) return { status: 'incorrect-password' }

		const now = new Date()
		const passwordHash = await hashPassword(password)

		await db.user.update({
			where: { id: user.id },
			data: {
				passwordHash,
				passwordChangedAt: now,
				sessionVersion: { increment: 1 },
			},
		})

		await db.passwordResetToken.updateMany({
			where: {
				userId: user.id,
				OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
			},
			data: { usedAt: now },
		})

		const locale = await getActionLocale()
		await sendPasswordChangedEmail({
			recipientEmail: user.email,
			recipientName: user.name || user.email,
			locale,
		}).catch((error) =>
			Sentry.captureException(error, {
				level: 'warning',
				tags: { action: 'changePassword', step: 'notification-email' },
			}),
		)

		return { status: 'success' }
	} catch (error) {
		Sentry.captureException(error, { tags: { action: 'changePassword' } })
		return { status: 'error' }
	}
}

export const verifyEmail = async (
	token: string,
): Promise<EmailVerificationResult> => {
	const trimmedToken = token.trim()
	if (!trimmedToken) return { status: 'invalid' }

	const now = new Date()

	try {
		const verificationToken = await db.emailVerificationToken.findUnique({
			where: { tokenHash: hashEmailVerificationToken(trimmedToken) },
			select: {
				id: true,
				userId: true,
				expiresAt: true,
				usedAt: true,
				user: { select: { emailVerified: true } },
			},
		})

		if (!verificationToken) {
			return { status: 'invalid' }
		}

		if (verificationToken.user.emailVerified) return { status: 'success' }

		if (verificationToken.expiresAt.getTime() <= now.getTime()) {
			return { status: 'expired' }
		}

		await db.user.update({
			where: { id: verificationToken.userId },
			data: { emailVerified: now },
		})

		try {
			await db.emailVerificationToken.updateMany({
				where: {
					userId: verificationToken.userId,
					OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
				},
				data: { usedAt: now },
			})
		} catch (error) {
			Sentry.captureException(error, {
				level: 'warning',
				tags: { action: 'verifyEmail', step: 'token-cleanup' },
			})
		}

		try {
			revalidatePath('/profile')
		} catch (error) {
			Sentry.captureException(error, {
				level: 'warning',
				tags: { action: 'verifyEmail', step: 'revalidate' },
			})
		}

		return { status: 'success' }
	} catch (error) {
		Sentry.captureException(error, { tags: { action: 'verifyEmail' } })
		return { status: 'invalid' }
	}
}

function buildAppUrl(path: string) {
	return new URL(path, env.NEXT_PUBLIC_SITE_URL).toString()
}

type PasswordResetLogLevel = 'info' | 'warning' | 'error'
type PasswordResetLogContext = Record<
	string,
	string | number | boolean | string[] | null | undefined
>

async function logPasswordResetEvent(
	event: string,
	level: PasswordResetLogLevel,
	context: PasswordResetLogContext = {},
) {
	const metadata = {
		...(await getPasswordResetHostMetadata()),
		...removeUndefinedValues(context),
	}

	Sentry.captureMessage(`password-reset:${event}`, {
		level,
		tags: { action: 'passwordReset', event },
		extra: metadata,
	})

	if (env.NODE_ENV === 'development') {
		const log =
			level === 'error' || level === 'warning' ? console.warn : console.info
		log(`[password-reset:${event}]`, metadata)
	}
}

async function getPasswordResetHostMetadata(): Promise<PasswordResetLogContext> {
	let requestHost: string | null = null
	let forwardedHost: string | null = null
	let refererHost: string | null = null

	try {
		const requestHeaders = await headers()
		requestHost = requestHeaders.get('host')
		forwardedHost = requestHeaders.get('x-forwarded-host')
		refererHost = getUrlHost(requestHeaders.get('referer'))
	} catch {
		// headers() is unavailable outside an active request context, including unit tests.
	}

	return {
		requestHost,
		forwardedHost,
		refererHost,
		configuredSiteHost: getUrlHost(env.NEXT_PUBLIC_SITE_URL),
	}
}

function getTokenMetadata(token: string): PasswordResetLogContext {
	const normalizedToken = token.trim()

	return {
		tokenLength: normalizedToken.length,
		tokenHashPrefix: normalizedToken
			? hashPasswordResetToken(normalizedToken).slice(0, 12)
			: null,
	}
}

function getTokenMetadataFromUnknown(value: unknown): PasswordResetLogContext {
	if (!value || typeof value !== 'object') {
		return { tokenLength: null, tokenHashPrefix: null }
	}

	const token = (value as { token?: unknown }).token
	if (typeof token !== 'string') {
		return { tokenLength: null, tokenHashPrefix: null }
	}

	return getTokenMetadata(token)
}

function getEmailDomainFromUnknown(value: unknown) {
	if (!value || typeof value !== 'object') return null
	const email = (value as { email?: unknown }).email
	return typeof email === 'string' ? getEmailDomain(email) : null
}

function getEmailDomain(email: string) {
	const [, domain] = email.trim().toLowerCase().split('@')
	return domain || null
}

function getIdTail(value: string) {
	return value.slice(-6)
}

function getUrlHost(value: string | null | undefined) {
	if (!value) return null
	try {
		return new URL(value).host
	} catch {
		return null
	}
}

function toIsoString(value: Date | null | undefined) {
	return value ? value.toISOString() : null
}

function removeUndefinedValues(context: PasswordResetLogContext) {
	return Object.fromEntries(
		Object.entries(context).filter(([, value]) => value !== undefined),
	)
}

async function getActionLocale(): Promise<EmailLocale> {
	try {
		const locale = await getLocale()
		if (locale === 'ca' || locale === 'en' || locale === 'es') return locale
	} catch {
		return 'en'
	}
	return 'en'
}

function isUniqueConstraintOn(error: unknown, field: string) {
	if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false
	if (error.code !== 'P2002') return false

	const target = error.meta?.target
	if (Array.isArray(target)) return target.includes(field)
	if (typeof target === 'string') return target.includes(field)

	return false
}
