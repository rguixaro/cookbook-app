import {
	GetSecretValueCommand,
	SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager'

import { env } from '@/env.mjs'

const secrets = new SecretsManagerClient({ region: env.AMAZON_REGION })

const CACHE_TTL = 60 * 60 * 1000 // 1 hour
let cached: { key: string; expiresAt: number } | null = null

/**
 * Get CloudFront private key from AWS Secrets Manager.
 * Cached in-memory for 1 hour to reduce latency and API calls.
 */
export async function getPrivateKey(): Promise<string> {
	if (cached && Date.now() < cached.expiresAt) return cached.key

	const response = await secrets.send(
		new GetSecretValueCommand({
			SecretId: env.AMAZON_CLOUDFRONT_PRIVATE_KEY_SECRET_NAME,
		}),
	)
	if (!response.SecretString) {
		throw new Error(
			'CloudFront private key secret not found or stored as binary',
		)
	}

	cached = { key: response.SecretString, expiresAt: Date.now() + CACHE_TTL }
	return cached.key
}
