import { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

import { env } from './env.mjs';

const { GOOGLE_ID, GOOGLE_CLIENT_SECRET } = env;

/**
 * NextAuth configuration
 */
export default {
	providers: [Google({ clientId: GOOGLE_ID, clientSecret: GOOGLE_CLIENT_SECRET })],
} satisfies NextAuthConfig;
