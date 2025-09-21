export interface User {
	id: string
	email: string | null
	name: string | null
	createdAt: Date
	updatedAt: Date
	image: string | null
	password: string | null
	savedRecipes: string[]
	isPrivate: boolean
}
