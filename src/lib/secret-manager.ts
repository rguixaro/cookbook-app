import {
	GetSecretValueCommand,
	SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager'

import { env } from '@/env.mjs'

const secrets = new SecretsManagerClient({ region: env.AMAZON_REGION })

/**
 * Get CloudFront private key from AWS Secrets Manager.
 */
export async function getPrivateKey(): Promise<string> {
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
	return response.SecretString
}
