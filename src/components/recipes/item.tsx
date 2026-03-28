'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { BookTextIcon, Clock, NotebookIcon } from 'lucide-react'
import { motion, Variants } from 'motion/react'

import Image, { ImageLoader } from 'next/image'

import { RecipeSchema } from '@/server/schemas'

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

/** Strip quantities, numbers, parentheses — keep just the ingredient name */
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

export function ItemRecipe({
	recipe,
	referred = false,
	query,
	category,
}: {
	recipe: RecipeSchema
	referred?: boolean
	query?: string
	category?: string
}) {
	const t = useTranslations('RecipesPage')
	const chipsRef = useRef<HTMLDivElement>(null)
	const [visibleCount, setVisibleCount] = useState<number | null>(null)
	const ceilingRef = useRef<number>(Infinity)

	const allChips = recipe.ingredients.map(cleanIngredient).filter(Boolean)
	const chipsToRender =
		visibleCount !== null ? allChips.slice(0, visibleCount) : allChips
	const hiddenCount = allChips.length - chipsToRender.length

	useLayoutEffect(() => {
		const container = chipsRef.current
		if (!container) return
		const children = Array.from(container.children) as HTMLElement[]
		if (children.length === 0) return

		const tops = children.map((c) => Math.round(c.getBoundingClientRect().top))

		// Group tops within 6px as the same row (badges/chips may differ slightly in height)
		const ROW_THRESHOLD = 6
		const uniqueTops: number[] = []
		for (const t of tops) {
			if (!uniqueTops.some((u) => Math.abs(u - t) <= ROW_THRESHOLD)) {
				uniqueTops.push(t)
			}
		}
		uniqueTops.sort((a, b) => a - b)

		const timeSlots = recipe.time ? 1 : 0

		if (uniqueTops.length > 2) {
			// Overflows — record that this ingredient count doesn't fit
			const badgePresent =
				visibleCount !== null && visibleCount < allChips.length
			const ingredientCount =
				children.length - timeSlots - (badgePresent ? 1 : 0)
			ceilingRef.current = Math.min(ceilingRef.current, ingredientCount)

			// Cut at row-3 boundary, reserving 1 slot for the +N badge
			const row3Top = uniqueTops[2]
			const thirdRowStart = tops.findIndex(
				(t) => Math.abs(t - row3Top) <= ROW_THRESHOLD,
			)
			const newVisible = Math.max(0, thirdRowStart - timeSlots - 1)
			if (newVisible !== visibleCount) setVisibleCount(newVisible)
		} else if (
			visibleCount !== null &&
			visibleCount < allChips.length &&
			visibleCount + 1 < ceilingRef.current
		) {
			// Fits in ≤ 2 rows but still truncating — try one more chip
			setVisibleCount(visibleCount + 1)
		}
	}, [visibleCount, allChips.length, recipe.time])

	const queryParams = referred
		? `?referred=true${query ? `&query=${encodeURIComponent(query.trim())}` : ''}${category ? `&category=${encodeURIComponent(category)}` : ''}`
		: query
			? `?query=${encodeURIComponent(query)}${category ? `&category=${encodeURIComponent(category)}` : ''}`
			: category
				? `?category=${encodeURIComponent(category)}`
				: ''

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
						'w-full my-2 flex shadow-sm overflow-hidden',
						'bg-forest-100 border-4 border-forest-150 rounded-2xl',
					)}>
					<div className='flex flex-col flex-1 min-w-0 bg-forest-150'>
						<div className='bg-forest-100 rounded-xl rounded-b-none'>
							<div className='flex items-center w-full bg-[#fefff2] px-4 py-2 rounded-xl'>
								<Icon name={recipe.category} />
								<span className='ms-2 text-base md:text-lg text-forest-200 font-extrabold leading-5 line-clamp-2'>
									{recipe.name}
								</span>
							</div>
						</div>
						<div
							ref={chipsRef}
							className='flex flex-wrap items-center gap-1.5 px-3 py-2 bg-forest-100'>
							{recipe.time && (
								<span className='shrink-0 inline-flex items-center bg-forest-200 px-2 py-0.5 rounded-lg'>
									<Clock
										{...IconProps}
										size={13}
										className='stroke-white'
									/>
									<span className='text-xs font-bold text-white ms-1'>{`${recipe.time}'`}</span>
								</span>
							)}
							{chipsToRender.map((name, i) => (
								<span
									key={i}
									className='inline-flex items-center text-xs font-semibold text-forest-300 bg-forest-150 px-2 py-0.5 rounded-lg'>
									<span className='truncate'>{name}</span>
								</span>
							))}
							{hiddenCount > 0 && (
								<span className='shrink-0 text-xs font-semibold text-forest-200/50'>
									{`+${hiddenCount}`}
								</span>
							)}
						</div>
						<div className='w-full px-3 pb-2 bg-forest-100 rounded-br-xl'>
							<span className='text-forest-300 text-xs md:text-sm line-clamp-2 leading-4'>
								{recipe.instructions}
							</span>
						</div>
					</div>
					{recipe.images?.[0] && (
						<div className='w-24 shrink-0 relative border-l-4 border-transparent bg-forest-150'>
							<Image
								src={recipe.images[0]}
								alt={recipe.name}
								fill
								loader={proxyLoader}
								className='object-cover rounded-xl'
							/>
						</div>
					)}
				</div>
			</motion.div>
		</Link>
	)
}
