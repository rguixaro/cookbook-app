import { useCallback, useEffect, useRef, useState } from 'react'

const REFRESH_INTERVAL = 5 * 60 * 60 * 1000 // 5 hours
const MAX_RETRIES = 3

/** Check if CloudFront signed cookies already exist in the browser. */
function hasCookies(): boolean {
	return document.cookie.split(';').some((c) => c.trim().startsWith('CloudFront-'))
}

/**
 * Hook to manage CloudFront cookies.
 * Skips refresh if cookies already exist. Refreshes every 5 hours (cookies expire after 6).
 * Retries with exponential backoff on failure.
 * Re-refreshes when the tab regains visibility after being idle, only if cookies are missing.
 */
export function useCookies(enabled: boolean = true) {
	const [ready, setReady] = useState(false)
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	const refreshCookies = useCallback(async (force = false) => {
		if (!force && hasCookies()) {
			setReady(true)
			return
		}

		for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
			try {
				const response = await fetch('/api/cookies/refresh', {
					method: 'POST',
					credentials: 'include',
				})

				if (response.ok) {
					setReady(true)
					return
				}

				console.error('[Cookies] Refresh failed:', response.statusText)
			} catch (e) {
				console.error('[Cookies] Refresh error:', e)
			}

			if (attempt < MAX_RETRIES - 1) {
				await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
			}
		}
	}, [])

	useEffect(() => {
		if (!enabled) return

		refreshCookies()

		// Force refresh on interval to renew before expiry
		intervalRef.current = setInterval(
			() => refreshCookies(true),
			REFRESH_INTERVAL,
		)

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				refreshCookies()
			}
		}

		document.addEventListener('visibilitychange', handleVisibilityChange)

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
			document.removeEventListener('visibilitychange', handleVisibilityChange)
		}
	}, [enabled, refreshCookies])

	return ready
}
