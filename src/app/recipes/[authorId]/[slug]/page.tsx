import { getTranslations } from 'next-intl/server'
import { Clock, Utensils } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { auth } from '@/auth'
import {
	getRecipeByAuthAndSlug,
	getProfileByUserId,
	getSavedRecipeIds,
	getFavouriteRecipeIds,
} from '@/server/queries'
import { GoBack } from '@/components/layout'
import { SyncAuthorName } from '@/components/profile'
import {
	RecipeDownload,
	RecipeEdit,
	RecipeShare,
	SavedStatus,
	FavouriteStatus,
} from '@/components/recipes'
import { TypographyH4 } from '@/ui'
import { IconProps, cn } from '@/utils'
import { Icon } from '@/components/recipes/icon'

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

	const backTo = isReferred
		? `/authors/${authorId}${paramQuery}${paramCategory}`
		: `/${paramQuery}${paramCategory}`

	if (!recipe) {
		return (
			<div className='flex flex-col pt-2 my-2 text-center'>
				<GoBack text={'recipes'} to={backTo} />
				<div className='h-32 mt-10 flex flex-col items-center justify-center text-forest-200'>
					<TypographyH4>{t('not-found')}</TypographyH4>
					<Utensils size={24} className='mt-2 mb-5' />
				</div>
			</div>
		)
	}

	const isOwner = session.user.id === recipe.authorId
	const savedIds = await getSavedRecipeIds()
	const isSaved = savedIds.includes(recipe.id)
	const favouriteIds = await getFavouriteRecipeIds()
	const isFavourited = favouriteIds.includes(recipe.id)

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

	const author = await getAuthor()

	return (
		<div className='flex flex-col pt-2 my-2 text-center'>
			<SyncAuthorName name={author.name} />
			<GoBack text={'recipes'} to={backTo}>
				<div className='flex space-x-3'>
					<RecipeShare recipe={recipe} />
					<RecipeDownload recipe={recipe} author={author} />
					<FavouriteStatus initial={isFavourited} recipeId={recipe.id} />
					{!isOwner ? (
						<SavedStatus initial={isSaved} recipeId={recipe.id} />
					) : (
						<RecipeEdit recipe={recipe} />
					)}
				</div>
			</GoBack>
			<div
				className={cn(
					'w-full mb-2 mt-5 flex flex-col items-center justify-center bg-forest-200/15 rounded-3xl border-4 border-forest-400/15',
				)}>
				<div className='bg-[#fefff2] rounded-[20px] p-4 shadow-sm w-full flex items-center justify-center'>
					<Icon name={recipe.category} />
					<span className='ms-2 text-lg md:text-xl text-forest-300 font-black leading-4 font-title'>
						{recipe.name}
					</span>
				</div>
				<div
					className={cn(
						'w-full mb-2 p-5 flex flex-col items-center justify-center',
					)}>
					{recipe.time && (
						<div className='flex mb-3 items-center bg-forest-200 text-white px-2 py-1 rounded-xl'>
							<p className='font-extrabold'>{t('time')}</p>
							<Clock
								{...IconProps}
								className='stroke-white  ms-5 mr-1'
							/>
							<span className='text-xs md:text-sm font-bold'>{`${recipe.time}'`}</span>
						</div>
					)}
					<div className='text-sm md:text-base'>
						<p className='font-extrabold text-forest-300'>
							{t('ingredients')}
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
					<div className='h-1.5 w-3/4 my-3 rounded bg-forest-400/15' />
					<div className='text-sm md:text-base'>
						<p className='font-extrabold text-forest-300'>
							{t('instructions')}
						</p>
						<span className='font-normal text-justify text-forest-400'>
							{recipe.instructions}
						</span>
					</div>
					<div className='h-1.5 w-3/4 my-3 rounded-xl bg-forest-400/15' />
					<div className='mt-3'>
						<Link href={`/authors/${authorId}`}>
							<div className='flex flex-col items-center justify-center space-y-1'>
								<Image
									src={author.image}
									referrerPolicy='no-referrer'
									alt='Profile image'
									width={40}
									height={40}
									className='rounded-xl border-2 border-forest-200/15 shadow-sm'
								/>
								<span className='font-bold text-forest-300 text-sm bg-[#fefff2] px-2 py-1 rounded-xl shadow-sm'>
									{` @${author.name}`}
								</span>
							</div>
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}
