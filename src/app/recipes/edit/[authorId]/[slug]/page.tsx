import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FileQuestion } from 'lucide-react'

import { auth } from '@/auth'
import { getRecipeByAuthAndSlug } from '@/server/queries'
import { EditRecipe } from '@/components/recipes/form'
import { TypographyH4 } from '@/ui'

export default async function EditRecipePage({
	params,
}: {
	params: Promise<{ authorId: string; slug: string }>
}) {
	const session = await auth()
	if (!session) return null

	const { slug, authorId } = await params
	const recipe = await getRecipeByAuthAndSlug(authorId, slug)
	const t = await getTranslations('common')

	if (!recipe) {
		return (
			<div className='mt-32 flex flex-col items-center justify-center text-forest-200'>
				<FileQuestion size={24} />
				<TypographyH4 className='mt-2 mb-5'>
					{t('user-not-found')}
				</TypographyH4>
				<Link href='/' className='mt-5 underline font-medium'>
					{t('return')}
				</Link>
			</div>
		)
	}

	return <EditRecipe userId={session.user.id!} recipe={recipe} />
}
