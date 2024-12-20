import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * Environment variables schema
 */
export const env = createEnv({
	server: {
		DATABASE_URL: z.string(),
		NODE_ENV: z
			.enum(['development', 'test', 'production'])
			.default('development'),
		AUTH_SECRET: z.string(),
		GOOGLE_ID: z.string(),
		GOOGLE_CLIENT_SECRET: z.string(),
	},
	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		NODE_ENV: process.env.NODE_ENV,
		AUTH_SECRET: process.env.AUTH_SECRET,
		GOOGLE_ID: process.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
	},
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
