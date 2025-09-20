'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Clock } from 'lucide-react'
import { motion, Variants } from 'framer-motion'

import { RecipeSchema } from '@/server/schemas'
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

	const queryParams = referred
		? `?referred=true${query ? `&query=${query.trim()}` : ''}${category ? `&category=${category}` : ''}`
		: query
			? `?query=${query}${category ? `&category=${category}` : ''}`
			: category
				? `?category=${category}`
				: ''

	return (
		<Link
			href={`/recipes/${recipe.authorId}/${recipe.slug}${queryParams}`}
			className='w-full'>
			<motion.div
				initial='offscreen'
				whileInView='onscreen'
				variants={motions}
				viewport={{ once: true, amount: 0.01 }}>
				<div
					className={cn(
						'w-full my-2 py-3 px-2 flex flex-col items-start',
						'border-4 border-forest-200/15 rounded',
						'transition-all duration-300 hover:bg-forest-200/15'
					)}>
					<div className='flex items-center justify-between w-full'>
						<div className='flex items-center'>
							<Icon name={recipe.category} />
							<span className='ms-2 text-base md:text-lg text-forest-200 font-bold'>
								{recipe.name}
							</span>
						</div>
						{recipe.time && (
							<div className='flex items-center justify-center'>
								<Clock {...IconProps} size={14} />
								<span className='text-xs md:text-sm font-bold text-neutral-600 ms-1'>{`${recipe.time}'`}</span>
							</div>
						)}
					</div>
					<div className='text-sm md:text-base mt-2'>
						<span className='font-semibold line-clamp-2 text-neutral-600'>
							{`${t('instructions')}: `}
							<span className='font-normal text-justify'>
								{recipe.instructions}
							</span>
						</span>
					</div>
				</div>
			</motion.div>
		</Link>
	)
}
