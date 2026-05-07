'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image, { ImageLoader } from 'next/image'

import { useTranslations } from 'next-intl'
import { motion, Variants } from 'motion/react'
import { ChefHat, Clock, ImageIcon, LoaderIcon } from 'lucide-react'

import { ProfileSchema } from '@/server/schemas'
import { Icon } from '@/components/recipes/icon'
import { useCookiesReady } from '@/providers/cookie-provider'
import { cn } from '@/utils'

const proxyLoader: ImageLoader = ({ src, width, quality }) => {
	return `/api/proxy?url=${encodeURIComponent(src)}&w=${width}${quality ? `&q=${quality}` : ''}`
}

const motions: Variants = {
	offscreen: { opacity: 0, y: 75 },
	onscreen: {
		opacity: 1,
		y: 0,
		transition: { type: 'spring', bounce: 0.2, duration: 0.8 },
	},
}

function LatestRecipeImage({
	src,
	alt,
	className,
}: {
	src: string
	alt: string
	className?: string
}) {
	const cookiesReady = useCookiesReady()
	const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

	useEffect(() => {
		setStatus('loading')
	}, [src])

	useEffect(() => {
		if (!cookiesReady) setStatus('loading')
	}, [cookiesReady])

	const showSpinner = !cookiesReady || status === 'loading'
	const showFallback = cookiesReady && status === 'error'

	return (
		<div
			className={cn(
				'relative ms-2 w-24 shrink-0 overflow-hidden rounded-xl bg-forest-150',
				className,
			)}>
			{showSpinner && (
				<div
					role='status'
					aria-label='Loading recipe image'
					className='absolute inset-0 flex items-center justify-center'>
					<LoaderIcon size={22} className='animate-spin text-forest-200' />
				</div>
			)}
			{showFallback && (
				<div
					role='img'
					aria-label='Recipe image failed to load'
					className='absolute inset-0 flex items-center justify-center'>
					<ImageIcon size={22} className='text-forest-200' />
				</div>
			)}
			{cookiesReady && !showFallback && (
				<Image
					src={src}
					referrerPolicy='no-referrer'
					alt={alt}
					sizes='96px'
					fill
					loader={proxyLoader}
					className='object-cover'
					onLoad={() => setStatus('loaded')}
					onError={() => setStatus('error')}
				/>
			)}
		</div>
	)
}

export function ItemProfile({
	profile,
	query,
}: {
	profile: ProfileSchema
	query?: string
}) {
	const t = useTranslations('RecipesPage')
	const tProfiles = useTranslations('ProfilesPage')
	const tCourses = useTranslations('RecipeCourses')
	const tCategories = useTranslations('RecipeCategories')
	const queryParams = query ? `?search=${encodeURIComponent(query)}` : ''
	const recipeCount = (
		<div className='flex items-center space-x-2'>
			<span className='font-bold text-sm text-forest-200'>
				{t('recipe-count', { count: profile.recipesCount })}
			</span>
			<ChefHat size={14} className='text-forest-200 inline-block' />{' '}
		</div>
	)

	return (
		<Link
			href={`/profiles/${profile.username}${queryParams}`}
			className='w-full'>
			<motion.div
				initial='offscreen'
				whileInView='onscreen'
				variants={motions}
				viewport={{ once: true, amount: 0.01 }}>
				<div className='my-1 flex bg-forest-150 border-8 border-forest-150 rounded-2xl shadow-center-sm'>
					<div className='min-w-0 flex flex-1 flex-col items-start rounded-xl bg-forest-150'>
						<div className='w-full rounded-xl rounded-b-none border-b-8 border-forest-150'>
							<div className='w-full px-4 py-2 rounded-xl bg-forest-50'>
								<span className='text-base font-title md:text-lg text-forest-300 font-extrabold leading-4'>
									{`@${profile.name}`}
								</span>
							</div>
						</div>
						{profile.latestRecipe && (
							<div
								className={cn(
									'grid w-full bg-forest-150 text-forest-300',
									profile.latestRecipe.image
										? 'grid-cols-[minmax(0,1fr)_auto]'
										: 'grid-cols-1',
								)}>
								<div className='min-w-0 rounded-xl bg-forest-100 px-3 py-2'>
									<div className='flex min-w-0 flex-col'>
										<span className='text-[10px] font-semibold text-forest-200/75'>
											{tProfiles('latest-recipe')}
										</span>
										<span className='truncate text-sm font-bold leading-5'>
											{profile.latestRecipe.name}
										</span>
										<div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
											{profile.latestRecipe.time && (
												<span className='shrink-0 inline-flex items-center bg-forest-200 px-3 py-0.5 rounded-lg'>
													<Clock
														size={12}
														className='stroke-forest-50'
													/>
													<span className='text-xs font-bold text-forest-50 ms-1'>{`${profile.latestRecipe.time}'`}</span>
												</span>
											)}
											<span className='inline-flex items-center gap-1.5 rounded-lg bg-forest-200/75 px-2.5 py-0.5 text-xs font-bold text-forest-50'>
												<Icon
													name={
														profile.latestRecipe.course
													}
													size={14}
													className='stroke-forest-50'
												/>
												{tCourses(
													profile.latestRecipe.course.toLowerCase(),
												)}
											</span>
											{profile.latestRecipe.categories.map(
												(category) => (
													<span
														key={category}
														className='inline-flex items-center text-xs font-semibold text-forest-200 bg-forest-150 px-2 py-0.5 rounded-lg'>
														{tCategories(
															category.toLowerCase(),
														)}
													</span>
												),
											)}
										</div>
									</div>
								</div>
								{profile.latestRecipe.image && (
									<LatestRecipeImage
										src={profile.latestRecipe.image}
										alt={profile.latestRecipe.name}
										className='col-start-2 row-start-1 self-stretch'
									/>
								)}
							</div>
						)}
					</div>
				</div>
			</motion.div>
		</Link>
	)
}
