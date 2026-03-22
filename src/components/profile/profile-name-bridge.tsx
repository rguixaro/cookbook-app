'use client'

import { useEffect } from 'react'
import { useProfileContext } from '@/providers'

export function SyncProfileName({ name }: { name: string }) {
	const { setProfileName } = useProfileContext()

	useEffect(() => {
		setProfileName(name)
		return () => setProfileName(undefined)
	}, [name, setProfileName])

	return null
}
