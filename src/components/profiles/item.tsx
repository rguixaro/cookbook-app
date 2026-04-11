'use client'

import Link from 'next/link'
import Image from 'next/image'

import { useTranslations } from 'next-intl'
import { motion, Variants } from 'motion/react'
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

	const queryParams = query ? `?query=${encodeURIComponent(query)}` : ''

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
					<div className='w-20 shrink-0 relative border-r-8 border-transparent bg-forest-150'>
						<Image
							src={profile.image}
							referrerPolicy='no-referrer'
							alt='Profile image'
							sizes='64px'
							fill
							className='object-cover rounded-xl'
						/>
					</div>
					<div className='w-full flex flex-col items-start rounded-xl bg-forest-150'>
						<div className=' w-full  rounded-xl rounded-b-none border-b-8 border-forest-150'>
							<div className='w-full px-4 py-2 rounded-xl bg-forest-50'>
								<span className='text-base font-title md:text-lg text-forest-300 font-extrabold leading-4'>
									{`@${profile.name}`}
								</span>
							</div>
						</div>
						<div className='w-full px-4 py-2 text-sm bg-forest-100 rounded-xl text-forest-300 flex justify-between'>
							<span className='font-bold'>
								<ChefHat
									size={14}
									className='inline-block mr-1 mb-0.5'
								/>
								{t('recipe-count', { count: profile.recipesCount })}
							</span>
						</div>
					</div>
				</div>
			</motion.div>
		</Link>
	)
}
