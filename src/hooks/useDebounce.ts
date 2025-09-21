import { useEffect, useState } from 'react'

/**
 * Use debounce hook.
 * @param value
 * @param delay
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number) {
	const [debounceValue, setDebounceValue] = useState(value)

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebounceValue(value)
		}, delay)

		return () => clearTimeout(handler)
	}, [value, delay])

	return debounceValue
}
