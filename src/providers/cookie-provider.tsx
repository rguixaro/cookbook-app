'use client'

import { createContext, useContext } from 'react'
import { useSession } from 'next-auth/react'

import { useCookies } from '@/hooks/useCookies'

const CookiesReadyContext = createContext(false)

export const useCookiesReady = () => useContext(CookiesReadyContext)

/**
 * Client component that manages CloudFront cookies for authenticated users.
 * Exposes cookie readiness via context so children can defer image loading.
 */
export function CookiesProvider({ children }: { children?: React.ReactNode }) {
	const { status } = useSession()

	const ready = useCookies(status === 'authenticated')

	return (
		<CookiesReadyContext.Provider value={ready}>
			{children}
		</CookiesReadyContext.Provider>
	)
}
