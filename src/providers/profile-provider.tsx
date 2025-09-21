'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type ProfileContextType = {
	currentUserName?: string
	authorName?: string
	setAuthorName: (name?: string) => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({
	children,
	initialName,
}: {
	children: ReactNode
	initialName?: string
}) {
	const [currentUserName] = useState(initialName)
	const [authorName, setAuthorName] = useState<string | undefined>()

	return (
		<ProfileContext.Provider
			value={{ currentUserName, authorName, setAuthorName }}>
			{children}
		</ProfileContext.Provider>
	)
}

export function useProfileContext() {
	const ctx = useContext(ProfileContext)
	if (!ctx)
		throw new Error('useProfileContext must be used inside ProfileProvider')
	return ctx
}
