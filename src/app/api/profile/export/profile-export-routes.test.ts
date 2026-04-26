import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', () => ({
	auth: vi.fn(),
}))

vi.mock('@/server/export/profile-export', () => ({
	collectProfileJsonExport: vi.fn(),
	collectProfileImagesExport: vi.fn(),
}))

import { auth } from '@/auth'
import {
	collectProfileImagesExport,
	collectProfileJsonExport,
} from '@/server/export/profile-export'
import { GET as getDataExport } from './data/route'
import { GET as getImagesExport } from './images/route'

const mockAuth = vi.mocked(auth)
const mockCollectProfileJsonExport = vi.mocked(collectProfileJsonExport)
const mockCollectProfileImagesExport = vi.mocked(collectProfileImagesExport)

beforeEach(() => {
	vi.clearAllMocks()
})

describe('profile export routes', () => {
	it('returns 401 for unauthenticated data exports', async () => {
		mockAuth.mockResolvedValue(null as any)

		const response = await getDataExport()

		expect(response.status).toBe(401)
		expect(await response.json()).toEqual({ error: 'Unauthorized' })
	})

	it('returns JSON attachment headers for data exports', async () => {
		mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
		mockCollectProfileJsonExport.mockResolvedValue({
			error: false,
			filename: 'owner-cookbook-export.json',
			payload: { schemaVersion: 1 },
		})

		const response = await getDataExport()

		expect(response.status).toBe(200)
		expect(response.headers.get('Content-Type')).toBe(
			'application/json; charset=utf-8',
		)
		expect(response.headers.get('Content-Disposition')).toBe(
			'attachment; filename="owner-cookbook-export.json"',
		)
		expect(response.headers.get('Cache-Control')).toBe('private, no-store')
		expect(await response.json()).toEqual({ schemaVersion: 1 })
	})

	it('returns 401 for unauthenticated image exports', async () => {
		mockAuth.mockResolvedValue(null as any)

		const response = await getImagesExport()

		expect(response.status).toBe(401)
		expect(await response.json()).toEqual({ error: 'Unauthorized' })
	})

	it('returns ZIP attachment headers for image exports', async () => {
		mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
		mockCollectProfileImagesExport.mockResolvedValue({
			error: false,
			filename: 'owner-recipe-images.zip',
			stream: new ReadableStream<Uint8Array>({
				start(controller) {
					controller.enqueue(new Uint8Array([1, 2, 3]))
					controller.close()
				},
			}),
		})

		const response = await getImagesExport()

		expect(response.status).toBe(200)
		expect(response.headers.get('Content-Type')).toBe('application/zip')
		expect(response.headers.get('Content-Disposition')).toBe(
			'attachment; filename="owner-recipe-images.zip"',
		)
		expect(response.headers.get('Cache-Control')).toBe('private, no-store')
	})
})
