import { getTranslations } from 'next-intl/server'
import { Clock, Utensils } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { auth } from '@/auth'
import { getRecipeByAuthAndSlug, getProfileByUserId } from '@/server/queries'
import { GoBack } from '@/components/layout'
import { SyncAuthorName } from '@/components/profile'
import {
	RecipeDownload,
	RecipeEdit,
	RecipeShare,
	SavedStatus,
} from '@/components/recipes'
import { TypographyH4 } from '@/ui'
import { IconProps, cn } from '@/utils'

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
			<SyncAuthorName name={author.name} />
			<GoBack
				text={'recipes'}
				to={
					isReferred
						? `/profile/${authorId}${paramQuery}${paramCategory}`
						: `/${paramQuery}${paramCategory}`
				}>
				<div className='flex space-x-3'>
					<RecipeShare recipe={recipe} />
					<RecipeDownload recipe={recipe} author={author} />
					{!isOwner ? (
						<SavedStatus
							initial={isSaved}
							recipeId={recipe?.id as string}
						/>
					) : (
						<RecipeEdit recipe={recipe} />
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
						'w-full mb-2 mt-5 p-5 flex flex-col items-center justify-center bg-forest-200/15 rounded-lg border-4 border-forest-400/15'
					)}>
					<span className='text-lg md:text-xl text-forest-300 font-bold'>
						{recipe.name}
					</span>
					<div className='h-1 w-2/4 mt-3 mb-7 bg-forest-300/75' />
					{recipe.time && (
						<div className='flex flex-col items-center w-full'>
							<div className='flex items-center'>
								<p className='font-semibold text-forest-300'>
									{t('time').toUpperCase()}
								</p>
								<span className='text-xs md:text-sm text-forest-400 ms-5 mr-1'>{`${recipe.time}'`}</span>
								<Clock {...IconProps} color='#3D6C5F' />
							</div>
							<div className='h-0.5 w-3/4 my-3 bg-forest-300/15' />{' '}
						</div>
					)}
					<div className='text-sm md:text-base'>
						<p className='font-semibold text-forest-300'>
							{t('ingredients').toUpperCase()}
						</p>
						<span className='font-normal'>
							{recipe.ingredients.map((ingredient, index) => (
								<div
									key={index}
									className='font-normal text-forest-400'>
									{ingredient}
								</div>
							))}
						</span>
					</div>
					<div className='h-0.5 w-3/4 my-3 bg-forest-300/15' />
					<div className='text-sm md:text-base'>
						<p className='font-semibold text-forest-300'>
							{t('instructions').toUpperCase()}
						</p>
						<span className='font-normal text-justify text-forest-400'>
							{recipe.instructions}
						</span>
					</div>
					<div className='h-1 w-2/4 mt-7 bg-forest-300/75' />
					<div className='mt-3'>
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
