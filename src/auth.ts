import { PrismaAdapter } from '@auth/prisma-adapter'
import type { Adapter, AdapterUser } from 'next-auth/adapters'
import NextAuth from 'next-auth'
import { Prisma } from '@prisma/client'

import AuthConfig from '@/auth.config'
import { db } from '@/server/db'
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
	adapter,
	session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
	basePath: '/api/auth',
	secret: AUTH_SECRET,
	pages: { signIn: '/auth', error: '/auth/error' },
	callbacks: {
		async signIn() {
			return true
		},
		async session({ token, session }) {
			if (token.sub && session.user) session.user.id = token.sub

			if (session.user) {
				session.user.name = token.name
				session.user.email = token.email ?? ''
				session.user.isPrivate = token.isPrivate === true
			}

			return session
		},
		async jwt({ token, trigger, user }) {
			if (!token.sub) return token

			const shouldRefresh =
				trigger === 'signIn' ||
				trigger === 'update' ||
				!token.lastVerified ||
				Date.now() - (token.lastVerified as number) > 60 * 60 * 1000

			if (shouldRefresh) {
				try {
					const dbUser = await getUserById(token.sub)
					if (!dbUser) return { ...token, sub: undefined }
					token.name = dbUser.name
					token.email = dbUser.email
					token.isPrivate = dbUser.isPrivate
					token.lastVerified = Date.now()
				} catch {
					return token
				}
			}

			return token
		},
	},
	...AuthConfig,
})
