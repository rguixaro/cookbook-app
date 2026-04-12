// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { useInfiniteScroll } from './useInfiniteScroll'

type IntersectionCallback = (
	entries: Partial<IntersectionObserverEntry>[],
) => void

let observerCallback: IntersectionCallback
let observeMock: ReturnType<typeof vi.fn>
let disconnectMock: ReturnType<typeof vi.fn>

beforeEach(() => {
	observeMock = vi.fn()
	disconnectMock = vi.fn()

	vi.stubGlobal(
		'IntersectionObserver',
		class {
			constructor(cb: IntersectionCallback) {
				observerCallback = cb
			}
			observe = observeMock
			disconnect = disconnectMock
			unobserve = vi.fn()
		},
	)
})

afterEach(() => {
	vi.unstubAllGlobals()
})

function TestComponent({
	callback,
	enabled,
}: {
	callback: () => void
	enabled: boolean
}) {
	const sentinelRef = useInfiniteScroll(callback, enabled)
	return <div ref={sentinelRef} data-testid='sentinel' />
}

describe('useInfiniteScroll', () => {
	it('creates an observer and observes the sentinel when enabled', () => {
		render(<TestComponent callback={vi.fn()} enabled={true} />)

		expect(observeMock).toHaveBeenCalledOnce()
	})

	it('does not create an observer when disabled', () => {
		render(<TestComponent callback={vi.fn()} enabled={false} />)

		expect(observeMock).not.toHaveBeenCalled()
	})

	it('fires callback when entry is intersecting', () => {
		const callback = vi.fn()
		render(<TestComponent callback={callback} enabled={true} />)

		act(() => observerCallback([{ isIntersecting: true }]))
		expect(callback).toHaveBeenCalledOnce()
	})

	it('does not fire callback when entry is not intersecting', () => {
		const callback = vi.fn()
		render(<TestComponent callback={callback} enabled={true} />)

		act(() => observerCallback([{ isIntersecting: false }]))
		expect(callback).not.toHaveBeenCalled()
	})

	it('disconnects observer on unmount', () => {
		const { unmount } = render(
			<TestComponent callback={vi.fn()} enabled={true} />,
		)

		unmount()
		expect(disconnectMock).toHaveBeenCalledOnce()
	})
})
