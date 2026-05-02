import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

import { auth } from '@/auth'

export async function GET(req: Request) {
	try {
		const session = await auth()
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const allowedHost = new URL(
			process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN!,
		).host

		const { searchParams } = new URL(req.url)
		const url = searchParams.get('url')
		if (!url)
			return NextResponse.json(
				{ error: 'Missing url parameter' },
				{ status: 400 },
			)

		const targetUrl = new URL(url)
		if (targetUrl.host !== allowedHost) {
			return NextResponse.json({ error: 'Invalid url host' }, { status: 400 })
		}

		const allCookies = req.headers.get('cookie') || ''
		const cfCookies = allCookies
			.split(';')
			.map((c) => c.trim())
			.filter((c) => c.startsWith('CloudFront-'))
			.join('; ')

		const response = await fetch(targetUrl.toString(), {
			headers: { cookie: cfCookies },
		})

		if (!response.ok) {
			console.error(
				`[Proxy] CloudFront returned ${response.status} for ${targetUrl.pathname}`,
				response.status === 403 ? '- cookies may be expired or invalid' : '',
			)
			return NextResponse.json(
				{ error: 'Failed to fetch image' },
				{ status: response.status },
			)
		}

		const contentType = response.headers.get('content-type') || ''
		const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
		if (!ALLOWED_TYPES.some((t) => contentType.startsWith(t))) {
			return NextResponse.json(
				{ error: 'Invalid content type' },
				{ status: 403 },
			)
		}

		const MAX_SIZE = 10 * 1024 * 1024
		const contentLength = response.headers.get('content-length')
		if (contentLength && parseInt(contentLength, 10) > MAX_SIZE) {
			return NextResponse.json(
				{ error: 'Response too large' },
				{ status: 413 },
			)
		}

		const arrayBuffer = await response.arrayBuffer()
		if (arrayBuffer.byteLength > MAX_SIZE) {
			return NextResponse.json(
				{ error: 'Response too large' },
				{ status: 413 },
			)
		}

		return new Response(arrayBuffer, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'private, max-age=3600',
			},
		})
	} catch (error) {
		Sentry.captureException(error, { tags: { route: 'api/proxy' } })
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
