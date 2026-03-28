import { useEffect, useRef } from 'react'

/**
 * Hook to manage CloudFront cookies.
 * Refreshes immediately on mount and every 5 hours (cookies expire after 6).
 */
export function useCookies(enabled: boolean = true) {
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	useEffect(() => {
		if (!enabled) return

		const refreshCookies = async () => {
			try {
				const response = await fetch('/api/cookies/refresh', {
					method: 'POST',
					credentials: 'include',
				})

				if (!response.ok)
					console.error('Failed to refresh cookies:', response.statusText)
			} catch (e) {
				console.error('[Cookies] Failed to refresh CloudFront cookies:', e)
			}
		}

		const REFRESH_INTERVAL = 5 * 60 * 60 * 1000

		refreshCookies()

		intervalRef.current = setInterval(refreshCookies, REFRESH_INTERVAL)

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
		}
	}, [enabled])
}
