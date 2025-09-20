import { getTranslations } from 'next-intl/server'
import { Clock, NotebookPen, Utensils } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { auth } from '@/auth'
import { getRecipeByAuthAndSlug, getProfileByUserId } from '@/server/queries'
import { GoBack } from '@/components/layout/go-back'
import { SavedStatus } from '@/components/recipes/saved'
import { RecipeDownload } from '@/components/recipes/download'
import { IconProps, cn } from '@/utils'
import { TypographyH4 } from '@/ui'

export default async function RecipePage({
	params,
	searchParams,
}: {
	params: Promise<{ authorId: string; slug: string }>
	searchParams?: Promise<{
		referred?: boolean
		query?: string
		category?: string
	}>
}) {
	const session = await auth()
	if (!session) return null

	const { slug, authorId } = await params
	const isReferred = (await searchParams)?.referred
	const query = (await searchParams)?.query
	const category = (await searchParams)?.category

	const paramQuery = query ? `?search=${query}` : ''
	const paramCategory = category ? `${query ? '&' : '?'}category=${category}` : ''

	const recipe = await getRecipeByAuthAndSlug(authorId, slug)
	const t = await getTranslations('RecipesPage')

	const isOwner = session?.user?.id === recipe?.authorId
	const isSaved = session?.user?.savedRecipes.includes(recipe?.id as string)

	const author = await getAuthor()

	async function getAuthor(): Promise<{
		name: string
		image: string
	}> {
		if (!isOwner) {
			const { profile } = await getProfileByUserId(authorId)
			if (!profile) return { name: '', image: '' }
			return profile
		} else
			return {
				name: session?.user?.name as string,
				image: session?.user?.image as string,
			}
	}

	return (
		<div className='flex flex-col pt-2 my-2 text-center'>
			<GoBack
				text={'recipes'}
				to={
					isReferred
						? `/profile/${authorId}${paramQuery}${paramCategory}`
						: `/${paramQuery}${paramCategory}`
				}>
				<div className='flex space-x-3'>
					<RecipeDownload recipe={recipe} author={author} />
					{!isOwner ? (
						<SavedStatus
							initial={isSaved}
							recipeId={recipe?.id as string}
						/>
					) : (
						<Link
							href={`/recipes/edit/${recipe?.authorId}/${recipe?.slug}`}
							className='hover:bg-forest-200/15 p-1 rounded transition-colors duration-300'>
							<NotebookPen size={24} className='text-forest-200' />
						</Link>
					)}
				</div>
			</GoBack>
			{!recipe ? (
				<div className='h-32 mt-10 flex flex-col items-center justify-center text-forest-200'>
					<TypographyH4>{t('not-found')}</TypographyH4>
					<Utensils size={24} className='mt-2 mb-5' />
				</div>
			) : (
				<div
					className={cn(
						'w-full my-2 py-2 px-2 flex flex-col items-center justify-center '
					)}>
					<span className='text-lg md:text-xl text-forest-300 font-bold'>
						{recipe.name}
					</span>
					{recipe.time && (
						<div className='flex items-center justify-center w-full mt-2'>
							<Clock {...IconProps} />
							<span className='text-xs md:text-sm font-bold text-neutral-600 ms-2 mr-5'>{`${recipe.time}'`}</span>
						</div>
					)}
					<div className='text-sm md:text-base mt-5'>
						<p className='font-semibold text-forest-200'>
							{t('ingredients')}
						</p>
						<span className='font-normal'>
							{recipe.ingredients.map((ingredient, index) => (
								<div key={index} className='font-normal'>
									{ingredient}
								</div>
							))}
						</span>
					</div>
					<div className='text-sm md:text-base mt-5'>
						<p className='font-semibold text-forest-200'>
							{t('instructions')}
						</p>
						<span className='font-normal text-justify'>
							{recipe.instructions}
						</span>
					</div>
					<div className='mt-5'>
						<Link href={`/profile/${authorId}`}>
							<div className='flex flex-col items-center justify-center space-y-2'>
								<Image
									src={author.image}
									referrerPolicy='no-referrer'
									alt='Profile image'
									width={32}
									height={32}
									className='rounded border-2 border-forest-200'
								/>
								<span className='font-semibold text-forest-200 text-sm'>
									{` @${author.name}`}
								</span>
							</div>
						</Link>
					</div>
				</div>
			)}
		</div>
	)
}
