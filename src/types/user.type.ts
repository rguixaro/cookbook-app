export interface User {
	id: string
	email: string | null
	name: string | null
	username: string
	createdAt: Date
	updatedAt: Date
	image: string | null
	savedRecipes: string[]
	favouriteRecipes: string[]
	isPrivate: boolean
}
