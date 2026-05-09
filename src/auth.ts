import { PrismaAdapter } from '@auth/prisma-adapter'
import type { Adapter, AdapterUser } from 'next-auth/adapters'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { Prisma } from '@prisma/client'
import * as Sentry from '@sentry/nextjs'

import AuthConfig from '@/auth.config'
import { sendWelcomeEmail } from '@/lib/email'
import { verifyPassword } from '@/lib/password'
import { db } from '@/server/db'
import { CredentialsSignInSchema } from '@/server/schemas'
import { getUserById } from '@/server/utils'
import { env } from './env.mjs'

const { AUTH_SECRET } = env

const prismaAdapter = PrismaAdapter(db) as Adapter

/**
 * Custom adapter that extends PrismaAdapter to generate a unique username
 * atomically during user creation. Retries on unique constraint collision.
 */
const adapter: Adapter = {
	...prismaAdapter,
	async createUser(data) {
		const prefix = (data.email ?? 'user')
			.split('@')[0]
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, '')
		let candidate = prefix
		let suffix = 2
		const MAX_RETRIES = 10

		for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
			try {
				const user = await db.user.create({
					data: {
						name: data.name,
						email: data.email!,
						image: data.image,
						emailVerified: data.emailVerified,
						username: candidate,
					},
				})
				return user as AdapterUser
			} catch (e) {
				if (
					e instanceof Prisma.PrismaClientKnownRequestError &&
					e.code === 'P2002' &&
					(e.meta?.target as string[])?.includes('username')
				) {
					candidate = `${prefix}-${suffix}`
					suffix++
				} else {
					throw e
				}
			}
		}

		const fallback = `${prefix}-${crypto.randomUUID().slice(0, 8)}`
		const user = await db.user.create({
			data: {
				name: data.name,
				email: data.email!,
				image: data.image,
				emailVerified: data.emailVerified,
				username: fallback,
			},
		})
		return user as AdapterUser
	},
}

/**
 * NextAuth configuration
 */
export const {
	handlers: { GET, POST },
	auth,
	signIn,
	signOut,
	unstable_update,
} = NextAuth({
	...AuthConfig,
	adapter,
	session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
	basePath: '/api/auth',
	secret: AUTH_SECRET,
	pages: { signIn: '/auth', error: '/auth/error' },
	events: {
		async createUser({ user }) {
			if (!user.email) return

			sendWelcomeEmail({
				recipientEmail: user.email,
				recipientName: user.name || user.email,
			}).catch((error) =>
				Sentry.captureException(error, {
					level: 'warning',
					tags: { action: 'createUser', step: 'welcome-email' },
				}),
			)
		},
	},
	providers: [
		...(AuthConfig.providers ?? []),
		Credentials({
			credentials: {
				email: { type: 'email' },
				password: { type: 'password' },
			},
			async authorize(credentials) {
				const parsed = CredentialsSignInSchema.safeParse(credentials)
				if (!parsed.success) return null

				const { email, password } = parsed.data
				const user = await db.user.findUnique({ where: { email } })
				if (!user) return null

				const isPasswordValid = await verifyPassword(
					password,
					user.passwordHash,
				)
				if (!isPasswordValid) return null

				return {
					id: user.id,
					email: user.email,
					name: user.name,
					image: user.image,
				}
			},
		}),
	],
	callbacks: {
		async signIn() {
			return true
		},
		async session({ token, session }) {
			if (!token.sub) return session
			if (session.user) session.user.id = token.sub

			if (session.user) {
				session.user.name = token.name
				session.user.email = token.email ?? ''
				session.user.isPrivate = token.isPrivate === true
			}

			return session
		},
		async jwt({ token, trigger, user, account, profile }) {
			if (!token.sub && user?.id) token.sub = user.id
			if (!token.sub) return null
			const isNewSession =
				trigger === 'signIn' || trigger === 'signUp' || Boolean(user)

			const shouldVerifyGoogleAccount =
				account?.provider === 'google' &&
				profile?.email_verified === true &&
				typeof profile.email === 'string' &&
				user?.email === profile.email &&
				'emailVerified' in user &&
				!user.emailVerified

			if (shouldVerifyGoogleAccount) {
				try {
					await db.user.update({
						where: { id: token.sub },
						data: { emailVerified: new Date() },
					})
				} catch (error) {
					Sentry.captureException(error, {
						tags: { callback: 'jwt', step: 'google-email-verification' },
					})
				}
			}

			try {
				const dbUser = await getUserById(token.sub)
				if (!dbUser) return null

				const tokenSessionVersion =
					typeof token.sessionVersion === 'number'
						? token.sessionVersion
						: 0

				if (!isNewSession && dbUser.sessionVersion > tokenSessionVersion) {
					return null
				}

				token.name = dbUser.name
				token.email = dbUser.email
				token.isPrivate = dbUser.isPrivate
				token.sessionVersion = dbUser.sessionVersion
				token.lastVerified = Date.now()
			} catch (error) {
				Sentry.captureException(error, {
					tags: { callback: 'jwt', step: 'token-refresh' },
				})
				return token
			}

			return token
		},
	},
})
