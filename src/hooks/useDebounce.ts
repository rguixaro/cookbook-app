import { useEffect, useState } from 'react';

/**
 * Use debounce hook.
 * @param callback
 * @param delay
 * @returns string
 */
export function useDebounce(callback: string, delay: number) {
	const [debounceValue, setDebounceValue] = useState(callback);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebounceValue(callback);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [callback, delay]);
	return debounceValue;
}
