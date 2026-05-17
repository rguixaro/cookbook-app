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
	showSentinel = true,
}: {
	callback: () => void
	enabled: boolean
	showSentinel?: boolean
}) {
	const sentinelRef = useInfiniteScroll(callback, enabled)
	return showSentinel ? <div ref={sentinelRef} data-testid='sentinel' /> : null
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

	it('observes the sentinel when it mounts after being enabled', () => {
		const callback = vi.fn()
		const { rerender } = render(
			<TestComponent
				callback={callback}
				enabled={false}
				showSentinel={false}
			/>,
		)

		rerender(
			<TestComponent callback={callback} enabled={true} showSentinel={false} />,
		)
		expect(observeMock).not.toHaveBeenCalled()

		rerender(
			<TestComponent callback={callback} enabled={true} showSentinel={true} />,
		)

		expect(observeMock).toHaveBeenCalledOnce()
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

	it('fires the latest callback when the callback changes', () => {
		const firstCallback = vi.fn()
		const secondCallback = vi.fn()
		const { rerender } = render(
			<TestComponent callback={firstCallback} enabled={true} />,
		)

		rerender(<TestComponent callback={secondCallback} enabled={true} />)
		act(() => observerCallback([{ isIntersecting: true }]))

		expect(firstCallback).not.toHaveBeenCalled()
		expect(secondCallback).toHaveBeenCalledOnce()
	})

	it('disconnects observer on unmount', () => {
		const { unmount } = render(
			<TestComponent callback={vi.fn()} enabled={true} />,
		)

		unmount()
		expect(disconnectMock).toHaveBeenCalledOnce()
	})
})
