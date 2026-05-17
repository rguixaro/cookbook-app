import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Clock4, ExternalLink } from 'lucide-react'

import { auth } from '@/auth'
import { GoBack } from '@/components/layout'
import {
	FavouriteStatus,
	RecipeDownload,
	RecipeInfo,
	RecipeShare,
	SavedStatus,
} from '@/components/recipes'
import { Icon } from '@/components/recipes/icon'
import {
	RecipeGallery,
	RecipeGalleryPlaceholder,
} from '@/components/recipes/gallery'
import { RecipeComplementTypes } from '@/types'
import {
	getFavouriteRecipeIds,
	getSavedRecipeIds,
	getShowcaseRecipeBySlug,
} from '@/server/queries'
import { SITE_URL, cn, formatIngredientLabel } from '@/utils'

const recipeOgImage = {
	url: '/images/favicon.png',
	width: 2731,
	height: 2731,
	alt: 'CookBook',
}

function formatRecipeInfoDate(date: Date) {
	return date.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})
}

function getCuisineForShowcaseSlug(slug: string) {
	if (slug.includes('carbonara') || slug.includes('focaccia')) return 'Italian'
	if (slug.includes('bourguignon') || slug.includes('crepes')) return 'French'
	if (slug.includes('allioli')) return 'Catalan'
	return 'Spanish'
}

function getJsonLd(
	recipe: NonNullable<Awaited<ReturnType<typeof getShowcaseRecipeBySlug>>>,
) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Recipe',
		name: recipe.name,
		description: recipe.instructions,
		image: recipe.images ?? [],
		recipeIngredient: recipe.ingredients,
		recipeInstructions: [
			{
				'@type': 'HowToStep',
				text: recipe.instructions,
			},
			...recipe.complements
				.filter((complement) => complement.instructions.trim() !== '')
				.map((complement) => ({
					'@type': 'HowToStep',
					name: complement.name ?? complement.type,
					text: complement.instructions,
				})),
		],
		recipeCategory: recipe.course,
		recipeCuisine: getCuisineForShowcaseSlug(recipe.slug),
		totalTime: recipe.time ? `PT${recipe.time}M` : undefined,
	}
}

function safeJsonLd(value: unknown) {
	return JSON.stringify(value).replace(/</g, '\\u003c')
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>
}): Promise<Metadata> {
	const { slug } = await params
	const recipe = await getShowcaseRecipeBySlug(slug)
	if (!recipe) return { title: 'Recipe Not Found - CookBook' }

	const url = new URL(`/discover/${slug}`, SITE_URL).toString()
	const image = recipe.images?.[0]

	return {
		title: recipe.name,
		description: recipe.instructions.slice(0, 160),
		alternates: { canonical: url },
		openGraph: {
			title: recipe.name,
			description: recipe.instructions.slice(0, 160),
			url,
			siteName: 'CookBook',
			type: 'article',
			images: image ? [{ url: image }] : [recipeOgImage],
		},
		twitter: {
			card: 'summary_large_image',
			title: recipe.name,
			description: recipe.instructions.slice(0, 160),
			images: image ? [image] : [recipeOgImage.url],
		},
	}
}

export default async function DiscoverRecipePage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const session = await auth()
	if (!session) {
		redirect(`/auth?callbackUrl=${encodeURIComponent(`/discover/${slug}`)}`)
	}

	const recipe = await getShowcaseRecipeBySlug(slug)
	const t = await getTranslations('RecipesPage')
	const tCourses = await getTranslations('RecipeCourses')
	const tCategories = await getTranslations('RecipeCategories')

	if (!recipe) notFound()

	const [savedIds, favouriteIds] = await Promise.all([
		getSavedRecipeIds(),
		getFavouriteRecipeIds(),
	])
	const isSaved = savedIds.includes(recipe.id)
	const isFavourited = favouriteIds.includes(recipe.id)
	const author = { name: 'CookBook', image: '/images/favicon.png' }
	const complements = RecipeComplementTypes.flatMap((type) =>
		recipe.complements.filter((complement) => complement.type === type),
	)
	const complementsWithInstructions = complements.filter(
		(complement) => complement.instructions.trim() !== '',
	)
	const getComplementLabel = (complement: (typeof complements)[number]) =>
		complement.name?.trim() || t(`complement-${complement.type.toLowerCase()}`)

	return (
		<div className='mt-5 flex w-full flex-col items-center text-center'>
			<script
				type='application/ld+json'
				dangerouslySetInnerHTML={{ __html: safeJsonLd(getJsonLd(recipe)) }}
			/>
			<div className='w-11/12 sm:w-3/5 lg:w-3/8'>
				<GoBack text='recipes' to='/discover'>
					<div className='flex space-x-3'>
						<RecipeShare recipe={recipe} />
						<RecipeDownload recipe={recipe} author={author} />
						{session && (
							<>
								<FavouriteStatus initial={isFavourited} recipeId={recipe.id} />
								<SavedStatus initial={isSaved} recipeId={recipe.id} />
							</>
						)}
					</div>
				</GoBack>
			</div>
			<div
				className={cn(
					'my-5 flex w-10/12 flex-col items-center justify-center rounded-3xl border-8 border-b-16 shadow-center-sm sm:w-2/4 lg:w-2/6',
					'border-forest-150 bg-forest-150',
				)}
			>
				<div className='w-full px-2'>
					<div className='rounded-t-[20px] border-y-8 border-forest-150 bg-forest-150 text-left'>
						<div className='flex h-12.5 w-full items-center justify-center rounded-[20px] bg-forest-50 px-4 shadow-center-sm'>
							<span className='font-title text-center text-lg font-black leading-4 text-forest-200 md:text-xl'>
								{recipe.name}
							</span>
						</div>
					</div>
					<div className='my-2 flex flex-wrap justify-center gap-1.5 px-4'>
						<span className='inline-flex items-center gap-1.5 rounded-lg bg-forest-200/75 px-2.5 py-1 text-xs font-bold text-forest-50'>
							<Icon
								name={recipe.course}
								size={14}
								className='stroke-forest-50'
							/>
							{tCourses(recipe.course.toLowerCase())}
						</span>
						{recipe.categories.map((category) => (
							<span
								key={category}
								className='inline-flex items-center rounded-lg bg-forest-100 px-2.5 py-1 text-xs font-semibold text-forest-200'
							>
								{tCategories(category.toLowerCase())}
							</span>
						))}
					</div>
					<div className='rounded-[20px] border-y-8 border-forest-150 bg-forest-150 py-0'>
						<div className='mb-2 rounded-[20px] bg-forest-100 shadow-center-sm'>
							{recipe.images?.length ? (
								<RecipeGallery images={recipe.images} />
							) : (
								<RecipeGalleryPlaceholder text={t('images-empty')} />
							)}
						</div>
						{recipe.time && (
							<section className='border-y-8 border-forest-150 bg-forest-150'>
								<div className='rounded-[20px] bg-forest-100 pb-4 pt-4 shadow-center-sm'>
									<div className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 sm:gap-3'>
										<div className='min-w-0 text-center'>
											<span className='text-base font-extrabold leading-none text-forest-200 md:text-lg'>
												{t('time')}
											</span>
										</div>
										<div className='shrink-0 rounded-2xl border-2 border-forest-150 bg-forest-50 shadow-center-sm'>
											<div className='flex flex-col items-center px-3 py-1 text-center sm:px-5 md:px-12'>
												<div className='flex flex-wrap items-center justify-between gap-2'>
													<span className='font-bold text-forest-200'>
														{recipe.time}
													</span>
													<Clock4 size={16} className='stroke-forest-200' />
												</div>
												<span className='w-full whitespace-nowrap text-left text-xs font-semibold text-forest-200'>
													{t('minutes')}
												</span>
											</div>
										</div>
									</div>
								</div>
							</section>
						)}
						<section className='border-y-8 border-forest-150 bg-forest-150'>
							<div className='rounded-[20px] bg-forest-100 pb-4 pt-3 shadow-center-sm'>
								<p className='text-base font-extrabold text-forest-200 md:text-lg'>
									{t('ingredients')}
								</p>
								<div className='space-y-4 px-4 pt-3'>
									<div className='flex flex-wrap justify-center gap-1.5'>
										{recipe.ingredients.map((ingredient, index) => (
											<span
												key={index}
												className='inline-flex items-center rounded-lg bg-forest-150 px-2.5 py-1 text-xs font-semibold text-forest-200'
											>
												{formatIngredientLabel(ingredient)}
											</span>
										))}
									</div>
									{complements.map((complement) => (
										<div key={complement.type}>
											<div className='flex flex-wrap justify-center gap-1.5'>
												<p className='w-fit self-center rounded-lg bg-forest-200/75 px-2 py-1 text-xs font-bold text-forest-50'>
													{getComplementLabel(complement)}
												</p>
												{complement.ingredients.map((ingredient, index) => (
													<span
														key={`${complement.type}-${index}`}
														className='inline-flex items-center rounded-lg bg-forest-150 px-2.5 py-1 text-xs font-semibold text-forest-200'
													>
														{formatIngredientLabel(ingredient)}
													</span>
												))}
											</div>
										</div>
									))}
								</div>
							</div>
						</section>
						<section className='border-y-8 border-forest-150 bg-forest-150'>
							<div className='rounded-[20px] bg-forest-100 pb-4 pt-3 shadow-center-sm'>
								<div className='px-4'>
									<p className='text-base font-extrabold text-forest-200 md:text-lg'>
										{t('instructions')}
									</p>
									<div className='mt-3 rounded-2xl border-2 border-forest-150 bg-forest-50 px-4 py-3 text-left text-sm font-medium text-forest-200 shadow-center-sm md:text-base'>
										<p className='whitespace-pre-line'>{recipe.instructions}</p>
										{complementsWithInstructions.map((complement) => (
											<div key={complement.type} className='mt-4'>
												<p className='w-fit rounded-lg bg-forest-200/75 px-2 py-1 text-xs font-bold text-forest-50'>
													{getComplementLabel(complement)}
												</p>
												<p className='mt-1 whitespace-pre-line'>
													{complement.instructions}
												</p>
											</div>
										))}
									</div>
								</div>
							</div>
						</section>
						{recipe.sourceUrls && recipe.sourceUrls.length > 0 && (
							<section className='border-y-8 border-forest-150 bg-forest-150'>
								<div className='rounded-[20px] bg-forest-100 pb-4 pt-3 shadow-center-sm'>
									<p className='text-base font-extrabold text-forest-200 md:text-lg'>
										{t('sources')}
									</p>
									<div className='mx-4 mt-3 flex flex-wrap items-center justify-center gap-1.5'>
										{recipe.sourceUrls.map((url, index) => (
											<a
												key={index}
												href={url}
												target='_blank'
												rel='noopener noreferrer'
												className='flex items-center justify-between rounded-lg bg-forest-150 px-3 py-1 text-forest-200 transition-colors hover:text-forest-300'
											>
												<span className='flex min-w-0 max-w-full items-center gap-2'>
													<ExternalLink size={14} className='shrink-0' />
													<span className='truncate py-1 text-xs font-semibold'>
														{new URL(url).hostname.replace('www.', '')}
													</span>
												</span>
											</a>
										))}
									</div>
								</div>
							</section>
						)}
					</div>
				</div>
			</div>
			<div className='-mt-2 mb-4 flex w-10/12 justify-center sm:w-2/4 lg:w-2/6'>
				<RecipeInfo
					createdAt={formatRecipeInfoDate(recipe.createdAt)}
					isOwner={false}
					updatedAt={formatRecipeInfoDate(recipe.updatedAt)}
				/>
			</div>
		</div>
	)
}
