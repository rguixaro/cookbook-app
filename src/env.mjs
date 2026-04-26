import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

/**
 * Environment variables schema
 */
export const env = createEnv({
	server: {
		DATABASE_URL: z.string().url(),
		NODE_ENV: z
			.enum(['development', 'test', 'production'])
			.default('development'),
		AUTH_SECRET: z.string().min(32),
		GOOGLE_ID: z.string(),
		GOOGLE_CLIENT_SECRET: z.string(),
		AMAZON_REGION: z.string(),
		AMAZON_S3_BUCKET_NAME: z.string(),
		AMAZON_CLOUDFRONT_KEY_PAIR_ID: z.string(),
		AMAZON_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME: z.string(),
		COOKIES_DOMAIN: z.string(),
		SENTRY_DSN: z.string().url().optional(),
		SENTRY_ORG: z.string().optional(),
		SENTRY_PROJECT: z.string().optional(),
	},
	client: {
		NEXT_PUBLIC_SITE_URL: z.string().url(),
		NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN: z.string().url(),
		NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
	},
	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		NODE_ENV: process.env.NODE_ENV,
		AUTH_SECRET: process.env.AUTH_SECRET,
		GOOGLE_ID: process.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
		AMAZON_REGION: process.env.AMAZON_REGION,
		AMAZON_S3_BUCKET_NAME: process.env.AMAZON_S3_BUCKET_NAME,
		AMAZON_CLOUDFRONT_KEY_PAIR_ID: process.env.AMAZON_CLOUDFRONT_KEY_PAIR_ID,
		AMAZON_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME:
			process.env.AMAZON_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME,
		COOKIES_DOMAIN: process.env.COOKIES_DOMAIN,
		SENTRY_DSN: process.env.SENTRY_DSN,
		SENTRY_ORG: process.env.SENTRY_ORG,
		SENTRY_PROJECT: process.env.SENTRY_PROJECT,
		NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
		NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN:
			process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN,
		NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
	},
	skipValidation:
		!!process.env.SKIP_ENV_VALIDATION && process.env.NODE_ENV !== 'production',
	emptyStringAsUndefined: true,
})
