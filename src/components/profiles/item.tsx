'use client'

import Link from 'next/link'
import Image from 'next/image'

import { useTranslations } from 'next-intl'
import { motion, Variants } from 'framer-motion'
import { ChefHat } from 'lucide-react'

import { ProfileSchema } from '@/server/schemas'

const motions: Variants = {
	offscreen: { opacity: 0, y: 75 },
	onscreen: {
		opacity: 1,
		y: 0,
		transition: { type: 'spring', bounce: 0.2, duration: 0.8 },
	},
}

export function ItemProfile({
	profile,
	query,
}: {
	profile: ProfileSchema
	query?: string
}) {
	const t = useTranslations('RecipesPage')

	const queryParams = query ? `?query=${query}` : ''

	return (
		<Link href={`/profiles/${profile.username}${queryParams}`} className='w-full'>
			<motion.div
				initial='offscreen'
				whileInView='onscreen'
				variants={motions}
				viewport={{ once: true, amount: 0.01 }}>
				<div className='my-1 bg-forest-200/15 border-4 border-forest-200/15 rounded-2xl shadow-sm'>
					<div className='flex items-center gap-3 bg-[#fefff2] rounded-xl px-4 py-2 shadow-sm'>
						<div className='w-8 h-8 shrink-0 rounded-lg overflow-hidden shadow-sm'>
							<Image
								src={profile.image}
								referrerPolicy='no-referrer'
								alt='Profile image'
								width={32}
								height={32}
							/>
						</div>
						<span className='text-base font-title md:text-lg text-forest-300 font-extrabold leading-4'>
							{`@${profile.name}`}
						</span>
					</div>
					<div className='px-4 py-2 text-sm'>
						<span className='font-bold text-forest-300'>
							<ChefHat
								size={14}
								className='inline-block mr-1 mb-0.5'
							/>
							{t('recipe-count', { count: profile.recipesCount })}
						</span>
					</div>
				</div>
			</motion.div>
		</Link>
	)
}
