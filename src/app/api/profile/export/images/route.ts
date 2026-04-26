import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { collectProfileImagesExport } from '@/server/export/profile-export'

export const runtime = 'nodejs'

export async function GET() {
	const session = await auth()
	const userId = session?.user?.id

	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const result = await collectProfileImagesExport(userId)

	if (result.error) {
		return NextResponse.json(
			{ error: result.message },
			{ status: result.status },
		)
	}

	return new Response(result.stream, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="${result.filename}"`,
			'Cache-Control': 'private, no-store',
		},
	})
}
