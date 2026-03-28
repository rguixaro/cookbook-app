import { NextResponse } from 'next/server'

import { getSignedCookies } from '@aws-sdk/cloudfront-signer'

import { env } from '@/env.mjs'

import { getPrivateKey } from './secret-manager'

/**
 * Generate CloudFront signed cookies and apply them to a response.
 * Cookies expire after 6 hours.
 */
export async function setCloudFrontCookies(
	response: NextResponse,
): Promise<{ expires: number }> {
	const privateKey = await getPrivateKey()
	const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 6

	const policy = {
		Statement: [
			{
				Resource: `${env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN}/*`,
				Condition: { DateLessThan: { 'AWS:EpochTime': expires } },
			},
		],
	}

	const cookies = getSignedCookies({
		privateKey,
		keyPairId: env.AMAZON_CLOUDFRONT_KEY_PAIR_ID,
		policy: JSON.stringify(policy),
	})

	Object.entries(cookies).forEach(([name, value]) => {
		response.cookies.set({
			name,
			value,
			path: '/',
			httpOnly: false,
			secure: true,
			sameSite: 'lax',
			domain: env.COOKIES_DOMAIN,
			maxAge: 60 * 60 * 6,
		})
	})

	return { expires }
}
