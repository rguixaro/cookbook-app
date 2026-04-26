import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { collectProfileJsonExport } from '@/server/export/profile-export'

export const runtime = 'nodejs'

export async function GET() {
	const session = await auth()
	const userId = session?.user?.id

	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const result = await collectProfileJsonExport(userId)

	if (result.error) {
		return NextResponse.json(
			{ error: result.message },
			{ status: result.status },
		)
	}

	return new Response(`${JSON.stringify(result.payload, null, 2)}\n`, {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Disposition': `attachment; filename="${result.filename}"`,
			'Cache-Control': 'private, no-store',
		},
	})
}
