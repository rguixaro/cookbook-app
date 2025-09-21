'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { motion, Variants } from 'framer-motion'

import { AuthorSchema } from '@/server/schemas'
import { cn } from '@/utils'

const motions: Variants = {
	offscreen: { opacity: 0, y: 75 },
	onscreen: {
		opacity: 1,
		y: 0,
		transition: { type: 'spring', bounce: 0.2, duration: 0.8 },
	},
}

export function ItemAuthor({
	author,
	query,
}: {
	author: AuthorSchema
	query?: string
}) {
	const t = useTranslations('RecipesPage')

	const queryParams = query ? `?query=${query}` : ''

	return (
		<Link href={`/authors/${author.id}${queryParams}`} className='w-3/4'>
			<motion.div
				initial='offscreen'
				whileInView='onscreen'
				variants={motions}
				viewport={{ once: true, amount: 0.01 }}>
				<div
					className={cn(
						'w-full py-3 px-4 flex flex-col items-start',
						'bg-forest-200/15 border-2 border-forest-200/20 rounded-lg',
						'transition-all duration-300 hover:bg-forest-200/25'
					)}>
					<span className='text-base md:text-lg text-forest-200 font-bold'>
						{author.name}
					</span>
					<span className='text-sm text-forest-300 mt-1'>
						{author.recipesCount}{' '}
						{author.recipesCount === 1 ? 'recipe' : 'recipes'}
					</span>
				</div>
			</motion.div>
		</Link>
	)
}
