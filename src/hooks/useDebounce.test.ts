// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
	beforeEach(() => vi.useFakeTimers())
	afterEach(() => vi.useRealTimers())

	it('returns the initial value immediately', () => {
		const { result } = renderHook(() => useDebounce('hello', 500))
		expect(result.current).toBe('hello')
	})

	it('does not update the value before the delay', () => {
		const { result, rerender } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{ initialProps: { value: 'hello', delay: 500 } },
		)

		rerender({ value: 'world', delay: 500 })
		act(() => vi.advanceTimersByTime(300))

		expect(result.current).toBe('hello')
	})

	it('updates the value after the delay', () => {
		const { result, rerender } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{ initialProps: { value: 'hello', delay: 500 } },
		)

		rerender({ value: 'world', delay: 500 })
		act(() => vi.advanceTimersByTime(500))

		expect(result.current).toBe('world')
	})

	it('resets the timer when value changes before delay expires', () => {
		const { result, rerender } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{ initialProps: { value: 'a', delay: 500 } },
		)

		rerender({ value: 'b', delay: 500 })
		act(() => vi.advanceTimersByTime(300))

		rerender({ value: 'c', delay: 500 })
		act(() => vi.advanceTimersByTime(300))

		expect(result.current).toBe('a')

		act(() => vi.advanceTimersByTime(200))
		expect(result.current).toBe('c')
	})
})
