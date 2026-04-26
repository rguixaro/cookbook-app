import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { Clock, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { auth } from '@/auth'
import {
	getRecipeByAuthAndSlug,
	getProfileByUsername,
	getUserByUsername,
	getSavedRecipeIds,
	getFavouriteRecipeIds,
} from '@/server/queries'

export async function generateMetadata({
	params,
}: {
	params: Promise<{ username: string; slug: string }>
}): Promise<Metadata> {
	const { username, slug } = await params
	const user = await getUserByUsername(username)
	const recipe = user ? await getRecipeByAuthAndSlug(user.id, slug) : null
	if (!recipe) return { title: 'Recipe Not Found — CookBook' }
	return {
		title: `${recipe.name} — CookBook`,
		description: `${recipe.name} by @${username}`,
		openGraph: {
			title: `${recipe.name} — CookBook`,
			description: `${recipe.name} by @${username}`,
			images: recipe.images?.[0] ? [recipe.images[0]] : [],
		},
	}
}
import { GoBack } from '@/components/layout'
import { SyncProfileName } from '@/components/profile'
import {
	RecipeDownload,
	RecipeEdit,
	RecipeShare,
	SavedStatus,
	FavouriteStatus,
} from '@/components/recipes'
import { IconProps, cn } from '@/utils'
import { Icon } from '@/components/recipes/icon'
import {
	RecipeGallery,
	RecipeGalleryPlaceholder,
} from '@/components/recipes/gallery'

export default async function RecipePage({
	params,
	searchParams,
}: {
	params: Promise<{ username: string; slug: string }>
	searchParams?: Promise<{
		referred?: boolean
		query?: string
		category?: string
	}>
}) {
	const session = await auth()
	if (!session) redirect('/auth')

	const { slug, username } = await params
	const isReferred = (await searchParams)?.referred
	const query = (await searchParams)?.query
	const category = (await searchParams)?.category

	const paramQuery = query ? `?search=${encodeURIComponent(query)}` : ''
	const paramCategory = category
		? `${query ? '&' : '?'}category=${encodeURIComponent(category)}`
		: ''

	const user = await getUserByUsername(username)
	const recipe = user ? await getRecipeByAuthAndSlug(user.id, slug) : null
	const t = await getTranslations('RecipesPage')

	const backTo = isReferred
		? `/profiles/${username}${paramQuery}${paramCategory}`
		: `/${paramQuery}${paramCategory}`

	if (!recipe) notFound()

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
			const { profile } = await getProfileByUsername(username)
			if (!profile) return { name: '', image: '' }
			return { name: profile.name ?? '', image: profile.image ?? '' }
		} else
			return {
				name: session?.user?.name as string,
				image: session?.user?.image as string,
			}
	}

	const author = await getAuthor()

	return (
		<div className='flex flex-col items-center pt-2 my-2 text-center w-full'>
			<SyncProfileName name={author.name} />
			<div className='w-11/12 sm:w-3/5 lg:w-3/8'>
				<GoBack text={'recipes'} to={backTo}>
					<div className='flex space-x-3'>
						<RecipeShare recipe={recipe} />
						<RecipeDownload recipe={recipe} author={author} />
						<FavouriteStatus
							initial={isFavourited}
							recipeId={recipe.id}
						/>
						{!isOwner ? (
							<SavedStatus initial={isSaved} recipeId={recipe.id} />
						) : (
							<RecipeEdit recipe={recipe} />
						)}
					</div>
				</GoBack>
			</div>
			<div
				className={cn(
					'w-10/12 sm:w-2/4 lg:w-2/6 my-5 rounded-3xl border-8',
					'flex flex-col items-center justify-center shadow-center-sm border-forest-150 bg-forest-150',
				)}>
				<div className='w-full border-b-8 border-forest-150 bg-forest-150 rounded-t-[20px]'>
					<div className='bg-forest-50 rounded-[20px] p-4 shadow-center-sm w-full min-h-12.5 flex items-center justify-center'>
						<Icon name={recipe.category} />
						<span className='ms-2 text-lg md:text-xl text-forest-300 font-black leading-4 font-title'>
							{recipe.name}
						</span>
					</div>
				</div>
				<div className='bg-forest-100 rounded-[20px]'>
						{recipe.images?.length ? (
							<RecipeGallery images={recipe.images} />
						) : (
							<RecipeGalleryPlaceholder
								text={
									isOwner
										? t('images-add-in-edit')
										: t('images-empty')
								}
							/>
						)}
					<div
						className={cn(
							'w-full mb-2 p-5 flex flex-col items-center justify-center',
						)}>
						{recipe.time && (
							<div className='flex mb-3 items-center bg-forest-200 text-forest-50 px-3 py-1 rounded-xl'>
								<p className='font-extrabold text-sm'>{t('time')}</p>
								<Clock
									{...IconProps}
									className='stroke-forest-50  ms-5 mr-1'
								/>
								<span className='text-xs md:text-sm font-bold'>{`${recipe.time}'`}</span>
							</div>
						)}
						<div>
							<p className='font-extrabold text-forest-300 text-sm md:text-base mb-2'>
								{t('ingredients')}
							</p>
							<div className='flex flex-wrap justify-center gap-1.5'>
								{recipe.ingredients.map((ingredient, index) => (
									<span
										key={index}
										className='inline-flex items-center text-xs font-semibold text-forest-300 bg-forest-150 px-2.5 py-1 rounded-lg'>
										{ingredient}
									</span>
								))}
							</div>
						</div>
						<div className='h-2 w-3/4 my-3 rounded bg-forest-150' />
						<div className='text-sm md:text-base'>
							<p className='font-extrabold text-forest-300 mb-2'>
								{t('instructions')}
							</p>
							<span className='font-normal text-justify text-forest-400'>
								{recipe.instructions}
							</span>
						</div>
						{recipe.sourceUrls && recipe.sourceUrls.length > 0 && (
							<>
								<div className='h-2 w-3/4 my-3 rounded bg-forest-150' />
								<div className='text-sm md:text-base'>
									<p className='font-extrabold text-forest-300'>
										{t('sources')}
									</p>
									<div className='flex flex-col gap-1 mt-1'>
										{recipe.sourceUrls.map((url, index) => (
											<a
												key={index}
												href={url}
												target='_blank'
												rel='noopener noreferrer'
												className='flex items-center gap-1.5 text-forest-200 hover:text-forest-300 transition-colors'>
												<ExternalLink
													size={14}
													className='shrink-0'
												/>
												<span className='truncate text-sm'>
													{new URL(url).hostname.replace(
														'www.',
														'',
													)}
												</span>
											</a>
										))}
									</div>
								</div>
							</>
						)}
					</div>
				</div>
				<Link
					href={`/profiles/${username}`}
					className='w-full block border-t-8 border-forest-150 bg-forest-150 rounded-b-[20px]'>
					<div className='flex items-center justify-center gap-3 bg-forest-50 rounded-[20px] px-3 py-2.5 transition-colors duration-200 '>
						<div className='w-8 h-8 shrink-0 rounded-lg overflow-hidden shadow-center-sm'>
							<Image
								src={author.image}
								referrerPolicy='no-referrer'
								alt='Profile image'
								width={32}
								height={32}
							/>
						</div>
						<span className='font-extrabold font-title text-forest-300 text-sm md:text-base truncate'>
							{`@${author.name}`}
						</span>
					</div>
				</Link>
			</div>
		</div>
	)
}
