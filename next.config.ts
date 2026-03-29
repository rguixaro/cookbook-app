import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const cloudfrontDomain = process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN ?? ''
const cloudfrontHostname = cloudfrontDomain
	? new URL(cloudfrontDomain).hostname
	: ''

const nextConfig: NextConfig = {
	poweredByHeader: false,
	pageExtensions: ['ts', 'tsx'],
	serverExternalPackages: [
		'sharp',
		'@aws-sdk/client-s3',
		'@aws-sdk/client-secrets-manager',
		'@aws-sdk/cloudfront-signer',
	],
	experimental: {
		optimizePackageImports: ['lucide-react'],
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com',
			},
			...(cloudfrontHostname
			? [{ protocol: 'https' as const, hostname: cloudfrontHostname }]
			: []),
		],
		localPatterns: [
			{
				pathname: '/api/proxy',
			},
		],
	},
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{
						key: 'X-Frame-Options',
						value: 'DENY',
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
					{
						key: 'Referrer-Policy',
						value: 'strict-origin-when-cross-origin',
					},
					{
						key: 'Permissions-Policy',
						value: 'camera=(), microphone=(), geolocation=()',
					},
					{
						key: 'Strict-Transport-Security',
						value: 'max-age=63072000; includeSubDomains; preload',
					},
					{
						key: 'Content-Security-Policy',
						value: [
							"default-src 'self'",
							"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
							"style-src 'self' 'unsafe-inline'",
							`img-src 'self' data: blob: https://lh3.googleusercontent.com${cloudfrontDomain ? ` ${cloudfrontDomain}` : ''}`,
							"font-src 'self'",
							`connect-src 'self'${cloudfrontDomain ? ` ${cloudfrontDomain}` : ''}${process.env.NODE_ENV === 'development' ? ' ws://127.0.0.1:* ws://localhost:*' : ''}`,
							"frame-ancestors 'none'",
						].join('; '),
					},
				],
			},
		]
	},
}

export default withNextIntl(nextConfig)
