import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FileQuestion } from 'lucide-react'

import { auth } from '@/auth'
import { getRecipeByAuthAndSlug, getUserByUsername } from '@/server/queries'
import { EditRecipe } from '@/components/recipes/form'
import { TypographyH4 } from '@/ui'

export default async function EditRecipePage({
	params,
}: {
	params: Promise<{ username: string; slug: string }>
}) {
	const session = await auth()
	if (!session) return null

	const { slug, username } = await params
	const t = await getTranslations('common')
	const t_recipes = await getTranslations('RecipesPage')

	const user = await getUserByUsername(username)

	/** Only the recipe owner can edit */
	if (!user || session.user.id !== user.id) {
		return (
			<div className='mt-32 flex flex-col items-center justify-center text-forest-200'>
				<FileQuestion size={24} />
				<TypographyH4 className='mt-2 mb-5'>
					{t_recipes('not-found')}
				</TypographyH4>
				<Link href='/' className='mt-5 underline font-medium'>
					{t('return')}
				</Link>
			</div>
		)
	}

	const recipe = await getRecipeByAuthAndSlug(user.id, slug)

	if (!recipe) {
		return (
			<div className='mt-32 flex flex-col items-center justify-center text-forest-200'>
				<FileQuestion size={24} />
				<TypographyH4 className='mt-2 mb-5'>
					{t_recipes('not-found')}
				</TypographyH4>
				<Link href='/' className='mt-5 underline font-medium'>
					{t('return')}
				</Link>
			</div>
		)
	}

	return <EditRecipe recipe={recipe} />
}
