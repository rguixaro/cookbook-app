export interface User {
	id: string
	email: string | null
	name: string | null
	username: string
	createdAt: Date
	updatedAt: Date
	image: string | null
	emailVerified: Date | null
	passwordHash: string | null
	passwordChangedAt: Date | null
	sessionVersion: number
	savedRecipes: string[]
	favouriteRecipes: string[]
	isPrivate: boolean
}
