'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Clock, ImageIcon, LoaderIcon } from 'lucide-react'
import { motion, Variants } from 'motion/react'

import Image, { ImageLoader } from 'next/image'

import { RecipeSchema } from '@/server/schemas'
import { useCookiesReady } from '@/providers/cookie-provider'

const proxyLoader: ImageLoader = ({ src, width, quality }) => {
	return `/api/proxy?url=${encodeURIComponent(src)}&w=${width}${quality ? `&q=${quality}` : ''}`
}
import { IconProps, cn } from '@/utils'
import { Icon } from './icon'

const motions: Variants = {
	offscreen: { opacity: 0, y: 75 },
	onscreen: {
		opacity: 1,
		y: 0,
		transition: { type: 'spring', bounce: 0.2, duration: 0.8 },
	},
}

const MAX_RECIPE_ITEM_CHIPS = 5

/** Strip quantities, numbers, parentheses, keep just the ingredient name */
function cleanIngredient(raw: string) {
	const cleaned = raw
		.replace(/\(.*?\)/g, '')
		.replace(
			/[\d.,/]+\s*(g|kg|mg|ml|l|cl|dl|oz|lb|tsp|tbsp|cup|cups|un|ud)?\s*/gi,
			'',
		)
		.replace(/^[-–—]\s*/, '')
		.trim()
	if (!cleaned) return raw.trim()
	return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function RecipeListImage({
	src,
	alt,
	cookiesReady,
}: {
	src: string
	alt: string
	cookiesReady: boolean
}) {
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
			className='w-28 shrink-0 relative border-l-8 border-transparent bg-forest-150'
			data-testid='recipe-image-rail'>
			{showSpinner && (
				<div
					role='status'
					aria-label='Loading recipe image'
					className='absolute inset-0 flex items-center justify-center'>
					<LoaderIcon size={24} className='animate-spin text-forest-200' />
				</div>
			)}
			{showFallback && (
				<div
					role='img'
					aria-label='Recipe image failed to load'
					className='absolute inset-0 flex items-center justify-center'>
					<ImageIcon size={24} className='text-forest-200' />
				</div>
			)}
			{cookiesReady && !showFallback && (
				<Image
					src={src}
					alt={alt}
					fill
					sizes='96px'
					loader={proxyLoader}
					className='object-cover rounded-xl'
					onLoad={() => setStatus('loaded')}
					onError={() => setStatus('error')}
				/>
			)}
		</div>
	)
}

export function ItemRecipe({
	recipe,
	referred = false,
	query,
	course,
	categories,
	sort,
}: {
	recipe: RecipeSchema
	referred?: boolean
	query?: string
	course?: string
	categories?: string
	sort?: string
}) {
	const t_courses = useTranslations('RecipeCourses')
	const t_categories = useTranslations('RecipeCategories')
	const cookiesReady = useCookiesReady()

	const allChips = useMemo(
		() =>
			[...recipe.ingredients]
				.sort((a, b) => (a.length < b.length ? -1 : 1))
				.map(cleanIngredient)
				.filter(Boolean),
		[recipe.ingredients],
	)
	const fixedChipCount = (recipe.time ? 1 : 0) + 1 + recipe.categories.length
	const visibleIngredientCount = Math.max(
		0,
		MAX_RECIPE_ITEM_CHIPS - fixedChipCount,
	)
	const chipsToRender = allChips.slice(0, visibleIngredientCount)
	const hiddenCount = allChips.length - chipsToRender.length

	const params = new URLSearchParams()
	if (referred) params.set('referred', 'true')
	if (query) params.set('query', query.trim())
	if (course) params.set('course', course)
	if (categories) params.set('categories', categories)
	if (sort) params.set('sort', sort)
	const queryParams = params.toString() ? `?${params.toString()}` : ''

	return (
		<Link
			href={`/recipes/${recipe.authorUsername}/${recipe.slug}${queryParams}`}
			className='w-full'>
			<motion.div
				initial='offscreen'
				whileInView='onscreen'
				variants={motions}
				viewport={{ once: true, amount: 0.01 }}>
				<div
					className={cn(
						'w-full my-2 flex shadow-center-sm overflow-hidden',
						'bg-forest-100 border-8 border-forest-150 rounded-2xl',
					)}>
					<div className='flex flex-col flex-1 min-w-0 bg-forest-150'>
						<div className='bg-forest-150 rounded-xl rounded-b-none border-b-8 border-forest-150'>
							<div className='w-full bg-forest-50 px-4 py-2 rounded-xl'>
								<span className='font-title text-base md:text-lg text-forest-200 font-extrabold leading-5 line-clamp-2'>
									{recipe.name}
								</span>
							</div>
						</div>
						<div className='bg-forest-100 rounded-xl px-3 py-2 space-y-2'>
							<div className='flex flex-wrap items-center gap-1.5'>
								{recipe.time && (
									<span className='shrink-0 inline-flex items-center bg-forest-200 px-3 py-0.5 rounded-lg'>
										<Clock
											{...IconProps}
											size={12}
											className='stroke-forest-50'
										/>
										<span className='text-xs font-bold text-forest-50 ms-1'>{`${recipe.time}'`}</span>
									</span>
								)}
								<span className='inline-flex items-center gap-1.5 rounded-lg bg-forest-200/75 px-2.5 py-0.5 text-xs font-bold text-forest-50'>
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
										className='inline-flex items-center text-xs font-semibold text-forest-200 bg-forest-150 px-2 py-0.5 rounded-lg'>
										{t_categories(category.toLowerCase())}
									</span>
								))}
								{chipsToRender.map((name, i) => (
									<span
										key={i}
										className='inline-flex max-w-[9rem] min-w-0 items-center rounded-lg bg-forest-150 px-2 py-0.5 text-xs font-semibold text-forest-300'>
										<span className='min-w-0 truncate'>
											{name}
										</span>
									</span>
								))}
								{hiddenCount > 0 && (
									<span className='shrink-0 text-xs font-semibold text-forest-200'>
										{`+${hiddenCount}`}
									</span>
								)}
							</div>
							<div className='w-full'>
								<span className='text-forest-300 text-xs md:text-sm line-clamp-2 leading-4'>
									{recipe.instructions}
								</span>
							</div>
						</div>
					</div>
					{recipe.images?.[0] && (
						<RecipeListImage
							src={recipe.images[0]}
							alt={recipe.name}
							cookiesReady={cookiesReady}
						/>
					)}
				</div>
			</motion.div>
		</Link>
	)
}
