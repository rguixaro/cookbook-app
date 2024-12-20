import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter } from 'next-auth/adapters';
import NextAuth from 'next-auth';

import AuthConfig from '@/auth.config';
import { db } from '@/server/db';
import { getUserById, getAccountByUserId } from '@/server/utils';
import { env } from './env.mjs';

const { AUTH_SECRET } = env;

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
	callbacks: {
		async signIn() {
			return true;
		},
		async session({ token, session }) {
			if (token.sub && session.user) session.user.id = token.sub;

			if (session.user) {
				session.user.name = token.name;
				session.user.email = token.email!;
				session.user.isOAuth = token.isOAuth as boolean;
			}

			return session;
		},
		async jwt({ token }) {
			if (!token.sub) return token;
			const existingUser = await getUserById(token.sub);

			if (!existingUser) return token;
			const existingAccount = await getAccountByUserId(existingUser.id);

			token.isOAuth = !!existingAccount;
			token.name = existingUser.name;
			token.email = existingUser.email;

			return token;
		},
	},
	...AuthConfig,
});
