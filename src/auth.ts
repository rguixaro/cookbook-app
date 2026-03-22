import { PrismaAdapter } from '@auth/prisma-adapter'
import type { Adapter } from 'next-auth/adapters'
import NextAuth from 'next-auth'

import AuthConfig from '@/auth.config'
import { db } from '@/server/db'
import { getUserById } from '@/server/utils'
import { env } from './env.mjs'

const { AUTH_SECRET } = env

/**
 * Derive a unique username from an email address.
 * Strips the domain, lowercases, removes non-alphanumeric chars (except -),
 * and appends -2, -3, etc. if the username is already taken.
 */
async function generateUsername(email: string): Promise<string> {
	const prefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '')
	let candidate = prefix
	let suffix = 2

	while (await db.user.findUnique({ where: { username: candidate } })) {
		candidate = `${prefix}-${suffix}`
		suffix++
	}

	return candidate
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
	adapter: PrismaAdapter(db) as Adapter,
	session: { strategy: 'jwt' },
	basePath: '/api/auth',
	secret: AUTH_SECRET,
	pages: { signIn: '/auth', error: '/auth/error' },
	events: {
		async createUser({ user }) {
			if (!user.id || !user.email) return
			const username = await generateUsername(user.email)
			await db.user.update({
				where: { id: user.id },
				data: { username },
			})
		},
	},
	callbacks: {
		async signIn() {
			return true
		},
		async session({ token, session }) {
			if (token.sub && session.user) session.user.id = token.sub

			if (session.user) {
				session.user.name = token.name
				session.user.email = token.email!
				session.user.isPrivate = token.isPrivate as boolean
			}

			return session
		},
		async jwt({ token }) {
			if (!token.sub) return token
			const existingUser = await getUserById(token.sub)

			if (!existingUser) return token

			token.name = existingUser.name
			token.email = existingUser.email
			token.isPrivate = existingUser.isPrivate

			return token
		},
	},
	...AuthConfig,
})
