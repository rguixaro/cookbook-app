import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTranslations } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { auth } from '@/auth'
import {
	getRecipeByAuthAndSlug,
	getPublicRecipeByUsernameAndSlug,
	getProfileByUsername,
	getUserByUsername,
	getSavedRecipeIds,
	getFavouriteRecipeIds,
} from '@/server/queries'
import { GoBack } from '@/components/layout'
import { SyncProfileName } from '@/components/profile'
import {
	RecipeDownload,
	RecipeEdit,
	RecipeShare,
	SavedStatus,
	FavouriteStatus,
} from '@/components/recipes'
import { SITE_URL, cn } from '@/utils'
import { isCrawlerUserAgent } from '@/utils/crawlers'
import { Icon } from '@/components/recipes/icon'
import {
	RecipeGallery,
	RecipeGalleryPlaceholder,
} from '@/components/recipes/gallery'
import { Input } from '@/ui'

const recipeOgImage = {
	url: '/images/favicon.png',
	width: 2731,
	height: 2731,
	alt: 'CookBook',
}

function getRecipeDescription(
	recipe: {
		name: string
		time?: number | null
		ingredients: string[]
	},
	username: string,
) {
	const details = [`by @${username}`]
	if (recipe.time) details.push(`${recipe.time} min`)
	if (recipe.ingredients.length) {
		details.push(`ingredients: ${recipe.ingredients.slice(0, 5).join(', ')}`)
	}

	return `${recipe.name} ${details.join(' · ')}`
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ username: string; slug: string }>
}): Promise<Metadata> {
	const { username, slug } = await params
	const user = await getUserByUsername(username)
	const recipe = user
		? ((await getRecipeByAuthAndSlug(user.id, slug)) ??
			(await getPublicRecipeByUsernameAndSlug(username, slug)))
		: null
	if (!recipe) return { title: 'Recipe Not Found — CookBook' }
	const title = `${recipe.name} — CookBook`
	const description = getRecipeDescription(recipe, username)
	const url = new URL(`/recipes/${username}/${slug}`, SITE_URL).toString()

	return {
		title,
		description,
		alternates: { canonical: url },
		openGraph: {
			title,
			description,
			url,
			siteName: 'CookBook',
			type: 'article',
			images: [recipeOgImage],
		},
		twitter: {
			card: 'summary',
			title,
			description,
			images: [recipeOgImage.url],
		},
	}
}

export default async function RecipePage({
	params,
	searchParams,
}: {
	params: Promise<{ username: string; slug: string }>
	searchParams?: Promise<{
		referred?: boolean
		query?: string
		course?: string
		categories?: string
		sort?: string
	}>
}) {
	const session = await auth()
	const requestHeaders = await headers()
	const isCrawler = isCrawlerUserAgent(requestHeaders.get('user-agent'))
	if (!session && !isCrawler) redirect('/auth')

	const { slug, username } = await params
	const currentSearchParams = await searchParams
	const isReferred = currentSearchParams?.referred
	const query = currentSearchParams?.query
	const course = currentSearchParams?.course
	const categories = currentSearchParams?.categories
	const sort = currentSearchParams?.sort

	const backParams = new URLSearchParams()
	if (query) backParams.set('search', query)
	if (course) backParams.set('course', course)
	if (categories) backParams.set('categories', categories)
	if (sort) backParams.set('sort', sort)
	const backQuery = backParams.toString() ? `?${backParams.toString()}` : ''

	const user = await getUserByUsername(username)
	const recipe = user
		? session
			? await getRecipeByAuthAndSlug(user.id, slug)
			: await getPublicRecipeByUsernameAndSlug(username, slug)
		: null
	const t = await getTranslations('RecipesPage')
	const t_courses = await getTranslations('RecipeCourses')
	const t_categories = await getTranslations('RecipeCategories')

	const backTo = isReferred ? `/profiles/${username}${backQuery}` : `/${backQuery}`

	if (!recipe) notFound()

	if (!session) {
		return (
			<main className='mx-auto flex w-10/12 max-w-xl flex-col gap-4 py-10 text-left text-forest-300'>
				<h1 className='font-title text-3xl font-black'>{recipe.name}</h1>
				<p className='font-semibold'>
					{getRecipeDescription(recipe, username)}
				</p>
				{recipe.ingredients.length > 0 && (
					<section>
						<h2 className='mb-2 font-title text-xl font-black'>
							{t('ingredients')}
						</h2>
						<ul className='list-disc space-y-1 ps-5 font-medium'>
							{recipe.ingredients.map((ingredient) => (
								<li key={ingredient}>{ingredient}</li>
							))}
						</ul>
					</section>
				)}
				<section>
					<h2 className='mb-2 font-title text-xl font-black'>
						{t('instructions')}
					</h2>
					<p className='whitespace-pre-line font-medium'>
						{recipe.instructions}
					</p>
				</section>
			</main>
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
					'w-10/12 sm:w-2/4 lg:w-2/6 my-5 rounded-3xl border-8 border-b-16',
					'flex flex-col items-center justify-center shadow-center-sm border-forest-150 bg-forest-150',
				)}>
				<div className='w-full px-2'>
					<div className='text-left border-y-8 border-forest-150 bg-forest-150 rounded-t-[20px]'>
						<div className='flex h-12.5 w-full items-center justify-center rounded-[20px] bg-forest-50 px-4 shadow-center-sm'>
							<span className='text-center text-lg md:text-xl text-forest-200 font-black leading-4 font-title'>
								{recipe.name}
							</span>
						</div>
					</div>
					<div className='flex flex-wrap justify-center gap-1.5 px-4 my-2'>
						<span className='inline-flex items-center gap-1.5 rounded-lg bg-forest-200/75 px-2.5 py-1 text-xs font-bold text-forest-50'>
							<Icon
								name={recipe.course}
								size={14}
								className='stroke-forest-50'
							/>
							{t_courses(recipe.course.toLowerCase())}
						</span>
						{recipe.categories.map((category) => (
							<span
								key={category}
								className='inline-flex items-center rounded-lg bg-forest-100 px-2.5 py-1 text-xs font-semibold text-forest-200'>
								{t_categories(category.toLowerCase())}
							</span>
						))}
					</div>
					<div className='border-y-8 border-forest-150 py-0 bg-forest-150 rounded-[20px]'>
						<div className='bg-forest-100 mb-2 rounded-[20px] shadow-center-sm'>
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
						</div>
						{recipe.time && (
							<section className='bg-forest-150 border-y-8 border-forest-150'>
								<div className='bg-forest-100 rounded-[20px] shadow-center-sm pt-4 pb-4'>
									<div className='flex items-center justify-between gap-3 space-y-0 px-4'>
										<div>
											<span className='text-base md:text-lg font-extrabold text-forest-200 leading-none'>
												{t('time')}
											</span>
										</div>
										<div className='py-2 sm:px-4 md:px-8' />
										<div className='inline-flex w-fit max-w-2/3 bg-forest-50 border-2 border-forest-150 rounded-2xl overflow-hidden shadow-center-sm'>
											<div className='flex px-3 py-1 items-center gap-2 text-center'>
												<Input
													value={recipe.time}
													readOnly
													tabIndex={-1}
													aria-label={t('time')}
													className='text-lg rounded border-none px-0 shadow-none! focus-visible:ring-0 text-right placeholder:text-forest-200/75'
												/>
												<span className='shrink-0 whitespace-nowrap text-sm font-bold text-forest-200'>
													{t('minutes')}
												</span>
											</div>
										</div>
									</div>
								</div>
							</section>
						)}
						<section className='bg-forest-150 border-y-8 border-forest-150'>
							<div className='bg-forest-100 rounded-[20px] shadow-center-sm pt-3 pb-4'>
								<p className='text-base md:text-lg font-extrabold text-forest-200'>
									{t('ingredients')}
								</p>
								<div className='flex flex-wrap justify-center gap-1.5 px-4 pt-3'>
									{recipe.ingredients.map((ingredient, index) => (
										<span
											key={index}
											className='inline-flex items-center text-xs font-semibold text-forest-200 bg-forest-150 px-2.5 py-1 rounded-lg'>
											{ingredient}
										</span>
									))}
								</div>
							</div>
						</section>
						<section className='bg-forest-150 border-y-8 border-forest-150'>
							<div className='bg-forest-100 rounded-[20px] shadow-center-sm pt-3 pb-4'>
								<div className='px-4'>
									<p className='text-base md:text-lg font-extrabold text-forest-200'>
										{t('instructions')}
									</p>
									<p className='shadow-center-sm mt-3 whitespace-pre-line rounded-2xl border-2 border-forest-150 bg-forest-50 px-4 py-3 text-left text-sm md:text-base font-medium text-forest-200'>
										{recipe.instructions}
									</p>
								</div>
							</div>
						</section>
						{recipe.sourceUrls && recipe.sourceUrls.length > 0 && (
							<section className='bg-forest-150 border-t-8 border-forest-150'>
								<div className='bg-forest-100 rounded-[20px] shadow-center-sm pt-3 pb-4'>
									<p className='text-base md:text-lg font-extrabold text-forest-200'>
										{t('sources')}
									</p>
									<div className='mx-4 mt-3 flex flex-col gap-1.5'>
										{recipe.sourceUrls.map((url, index) => (
											<a
												key={index}
												href={url}
												target='_blank'
												rel='noopener noreferrer'
												className='flex items-center justify-between rounded-lg bg-forest-150 px-3 py-1 text-forest-200 transition-colors hover:text-forest-300'>
												<span className='flex min-w-0 items-center gap-2'>
													<ExternalLink
														size={14}
														className='shrink-0'
													/>
													<span className='truncate py-1 text-xs font-semibold'>
														{new URL(
															url,
														).hostname.replace(
															'www.',
															'',
														)}
													</span>
												</span>
											</a>
										))}
									</div>
								</div>
							</section>
						)}
					</div>
					<Link
						href={`/profiles/${username}`}
						className='w-full block bg-forest-150 rounded-b-[20px]'>
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
		</div>
	)
}
