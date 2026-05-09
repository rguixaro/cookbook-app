import { createHash, randomBytes } from 'node:crypto'

import { db } from '@/server/db'

const EMAIL_VERIFICATION_TOKEN_BYTES = 32
const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000
const EMAIL_VERIFICATION_REQUEST_INTERVAL_MS = 60 * 1000
const PASSWORD_RESET_TOKEN_BYTES = 32
const PASSWORD_RESET_TOKEN_TTL_MS = 30 * 60 * 1000
const PASSWORD_RESET_REQUEST_INTERVAL_MS = 60 * 1000
const EMAIL_CHANGE_TOKEN_BYTES = 32
const EMAIL_CHANGE_TOKEN_TTL_MS = 30 * 60 * 1000
const EMAIL_CHANGE_REQUEST_INTERVAL_MS = 60 * 1000

export async function createEmailVerificationTokenForUser(
	userId: string,
	now = new Date(),
	throttle = false,
) {
	await db.emailVerificationToken.deleteMany({
		where: {
			userId,
			OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }],
		},
	})

	if (throttle) {
		const recentToken = await db.emailVerificationToken.findFirst({
			where: {
				userId,
				OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
				createdAt: {
					gte: new Date(
						now.getTime() - EMAIL_VERIFICATION_REQUEST_INTERVAL_MS,
					),
				},
			},
			select: { id: true },
		})

		if (recentToken) return null
	}

	const token = randomBytes(EMAIL_VERIFICATION_TOKEN_BYTES).toString('base64url')
	const expiresAt = new Date(now.getTime() + EMAIL_VERIFICATION_TOKEN_TTL_MS)

	await db.emailVerificationToken.create({
		data: {
			userId,
			tokenHash: hashEmailVerificationToken(token),
			createdAt: now,
			expiresAt,
			usedAt: null,
		},
	})

	return {
		token,
		expiresAt,
		verificationPath: `/auth/verify-email?token=${encodeURIComponent(token)}`,
	}
}

export async function createPasswordResetTokenForUser(
	userId: string,
	now = new Date(),
) {
	await db.passwordResetToken.deleteMany({
		where: {
			userId,
			OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }],
		},
	})

	const recentToken = await db.passwordResetToken.findFirst({
		where: {
			userId,
			OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
			createdAt: {
				gte: new Date(now.getTime() - PASSWORD_RESET_REQUEST_INTERVAL_MS),
			},
		},
		select: { id: true },
	})

	if (recentToken) return null

	await db.passwordResetToken.updateMany({
		where: {
			userId,
			OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
		},
		data: { usedAt: now },
	})

	const token = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('base64url')
	const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MS)

	await db.passwordResetToken.create({
		data: {
			userId,
			tokenHash: hashPasswordResetToken(token),
			createdAt: now,
			expiresAt,
			usedAt: null,
		},
	})

	return {
		token,
		expiresAt,
		resetPath: `/auth/reset-password?token=${encodeURIComponent(token)}`,
	}
}

export async function createEmailChangeTokenForUser(
	userId: string,
	newEmail: string,
	now = new Date(),
) {
	await db.emailChangeToken.deleteMany({
		where: {
			userId,
			OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }],
		},
	})

	const recentToken = await db.emailChangeToken.findFirst({
		where: {
			userId,
			OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
			createdAt: {
				gte: new Date(now.getTime() - EMAIL_CHANGE_REQUEST_INTERVAL_MS),
			},
		},
		select: { id: true },
	})

	if (recentToken) return null

	await db.emailChangeToken.updateMany({
		where: {
			userId,
			OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
		},
		data: { usedAt: now },
	})

	const token = randomBytes(EMAIL_CHANGE_TOKEN_BYTES).toString('base64url')
	const expiresAt = new Date(now.getTime() + EMAIL_CHANGE_TOKEN_TTL_MS)

	await db.emailChangeToken.create({
		data: {
			userId,
			newEmail,
			tokenHash: hashEmailChangeToken(token),
			createdAt: now,
			expiresAt,
			usedAt: null,
		},
	})

	return {
		token,
		expiresAt,
		changePath: `/auth/change-email?token=${encodeURIComponent(token)}`,
	}
}

export function hashPasswordResetToken(token: string) {
	return hashToken(token)
}

export function hashEmailVerificationToken(token: string) {
	return hashToken(token)
}

export function hashEmailChangeToken(token: string) {
	return hashToken(token)
}

function hashToken(token: string) {
	return createHash('sha256').update(token).digest('hex')
}
