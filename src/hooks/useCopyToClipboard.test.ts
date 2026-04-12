// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCopyToClipboard } from './useCopyToClipboard'

describe('useCopyToClipboard', () => {
	const writeTextMock = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
		Object.defineProperty(navigator, 'clipboard', {
			value: { writeText: writeTextMock },
			writable: true,
			configurable: true,
		})
	})

	it('initializes with null copiedText', () => {
		const { result } = renderHook(() => useCopyToClipboard())
		expect(result.current.copiedText).toBeNull()
	})

	it('copies text and returns true on success', async () => {
		writeTextMock.mockResolvedValue(undefined)
		const { result } = renderHook(() => useCopyToClipboard())

		let success: boolean
		await act(async () => {
			success = await result.current.copy('hello')
		})

		expect(success!).toBe(true)
		expect(result.current.copiedText).toBe('hello')
		expect(writeTextMock).toHaveBeenCalledWith('hello')
	})

	it('returns false and clears copiedText on failure', async () => {
		writeTextMock.mockRejectedValue(new Error('denied'))
		const { result } = renderHook(() => useCopyToClipboard())

		let success: boolean
		await act(async () => {
			success = await result.current.copy('hello')
		})

		expect(success!).toBe(false)
		expect(result.current.copiedText).toBeNull()
	})

	it('returns false when clipboard API is unavailable', async () => {
		Object.defineProperty(navigator, 'clipboard', {
			value: undefined,
			writable: true,
			configurable: true,
		})
		const { result } = renderHook(() => useCopyToClipboard())

		let success: boolean
		await act(async () => {
			success = await result.current.copy('hello')
		})

		expect(success!).toBe(false)
	})
})
