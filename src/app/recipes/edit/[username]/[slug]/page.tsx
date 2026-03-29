import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { auth } from '@/auth'

export const metadata: Metadata = {
	title: 'Edit Recipe — CookBook',
}
import { getRecipeByAuthAndSlug, getUserByUsername } from '@/server/queries'
import { EditRecipe } from '@/components/recipes/form'

export default async function EditRecipePage({
	params,
}: {
	params: Promise<{ username: string; slug: string }>
}) {
	const session = await auth()
	if (!session) redirect('/auth')

	const { slug, username } = await params

	const user = await getUserByUsername(username)

	/** Only the recipe owner can edit */
	if (!user || session.user.id !== user.id) notFound()

	const recipe = await getRecipeByAuthAndSlug(user.id, slug)
	if (!recipe) notFound()

	return <EditRecipe recipe={recipe} />
}
