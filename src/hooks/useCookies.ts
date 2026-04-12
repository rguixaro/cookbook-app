import { useCallback, useEffect, useRef, useState } from 'react'
import * as Sentry from '@sentry/nextjs'

const REFRESH_INTERVAL = 5 * 60 * 60 * 1000
const RETRY_INTERVAL = 30 * 1000
const MAX_RETRIES = 3

/** Check if CloudFront signed cookies exist and match this app's expected resource. */
function hasCookies(): boolean {
	const match = document.cookie
		.split(';')
		.map((c) => c.trim())
		.find((c) => c.startsWith('CloudFront-Policy='))

	if (!match) return false

	try {
		const value = match.split('=')[1]
		const decoded = JSON.parse(
			atob(value.replaceAll('_', '/').replaceAll('-', '+')),
		)
		const resource: string = decoded?.Statement?.[0]?.Resource ?? ''
		const expected = process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN ?? ''
		return resource.startsWith(expected)
	} catch {
		return false
	}
}

/**
 * Hook to manage CloudFront cookies.
 * Skips refresh if cookies already exist. Refreshes every 5 hours (cookies expire after 6).
 * Retries with exponential backoff on failure, then falls back to a slower retry interval.
 * Re-refreshes when the tab regains visibility after being idle, only if cookies are missing.
 */
export function useCookies(enabled: boolean = true) {
	const [ready, setReady] = useState(false)
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const clearRetry = useCallback(() => {
		if (retryRef.current) {
			clearTimeout(retryRef.current)
			retryRef.current = null
		}
	}, [])

	const refreshCookies = useCallback(
		async (force = false) => {
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
						clearRetry()
						setReady(true)
						return
					}

					Sentry.captureMessage(
						`CloudFront cookie refresh failed: ${response.status}`,
						{
							level: 'warning',
							tags: { hook: 'useCookies' },
						},
					)
				} catch (e) {
					Sentry.captureException(e, { tags: { hook: 'useCookies' } })
				}

				if (attempt < MAX_RETRIES - 1) {
					await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
				}
			}

			clearRetry()
			retryRef.current = setTimeout(() => refreshCookies(true), RETRY_INTERVAL)
		},
		[clearRetry],
	)

	useEffect(() => {
		if (!enabled) return

		refreshCookies()

		intervalRef.current = setInterval(
			() => refreshCookies(true),
			REFRESH_INTERVAL,
		)

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				clearRetry()
				refreshCookies()
			}
		}

		document.addEventListener('visibilitychange', handleVisibilityChange)

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
			clearRetry()
			document.removeEventListener('visibilitychange', handleVisibilityChange)
		}
	}, [enabled, refreshCookies, clearRetry])

	return ready
}
