import { NextResponse } from 'next/server'

import { auth } from '@/auth'

import { setCloudFrontCookies } from '@/lib/cloudfront'

/**
 * Refresh CloudFront cookies.
 * Auth required.
 */
export async function POST() {
	try {
		const session = await auth()
		if (!session?.user) {
			return NextResponse.json(
				{ success: false, error: 'Unauthorized' },
				{ status: 401 },
			)
		}

		const response = NextResponse.json({ success: true })
		await setCloudFrontCookies(response)

		return response
	} catch {
		return NextResponse.json(
			{ success: false, error: 'Failed to refresh cookies' },
			{ status: 500 },
		)
	}
}
