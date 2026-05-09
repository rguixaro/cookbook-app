import { type DefaultSession } from 'next-auth'

export type ExtendedUser = DefaultSession['user'] & {
	isPrivate: boolean
}

declare module 'next-auth' {
	interface Session {
		user: ExtendedUser
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		isPrivate?: boolean
		lastVerified?: number
		sessionVersion?: number
		user?: {
			username: string | undefined
		} & DefaultSession['user']
	}
}
