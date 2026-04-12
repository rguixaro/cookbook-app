import { NextResponse } from 'next/server'

import { db } from '@/server/db'

export async function GET() {
	const health: Record<string, unknown> = {
		status: 'ok',
		version: process.env.NEXT_PUBLIC_APP_VERSION,
		timestamp: new Date().toISOString(),
	}

	try {
		await db.$runCommandRaw({ ping: 1 })
		health.db = 'ok'
	} catch {
		health.status = 'degraded'
		health.db = 'error'
	}

	const statusCode = health.status === 'ok' ? 200 : 503
	return NextResponse.json(health, { status: statusCode })
}
