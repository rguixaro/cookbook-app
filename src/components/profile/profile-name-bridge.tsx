'use client'

import { useEffect } from 'react'
import { useProfileContext } from '@/providers'

export function SyncProfileName({ name }: { name: string }) {
	const { setAuthorName } = useProfileContext()

	useEffect(() => {
		setAuthorName(name)
		return () => setAuthorName(undefined)
	}, [name, setAuthorName])

	return null
}
