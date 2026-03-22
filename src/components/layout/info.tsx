'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import * as motion from 'motion/react-client'
import { AnimatePresence } from 'motion/react'
import { ChefHat, Utensils } from 'lucide-react'

import {
	TypographyH2,
	TypographyH3,
	TypographyH4,
	TypographyH5,
	TypographyP,
} from '@/ui'
import { AddRecipe } from '@/components/recipes/add'

/**
 * Header and Search bar height
 */
const headerHeight = 101
const searchHeight = 112
const notFoundHeight = 128

type InfoMode = 'recipes' | 'authors'

export function Info({ enabled, mode }: { enabled: boolean; mode: InfoMode }) {
	const t = useTranslations('common')

	const [status, setStatus] = useState<'bottom' | 'middle' | 'initial'>('initial')

	/**
	 * Y positions for the AddRecipe component
	 */
	const [windowHeight, setWindowHeight] = useState<number>(750)
	const topHeight = headerHeight + searchHeight
	const middleHeight = windowHeight - (2 * topHeight + 5 + notFoundHeight) - 25

	/**
	 * Motion variants for the AddRecipe component
	 */
	const variants = {
		hidden: { opacity: 0, y: 25, bottom: windowHeight / 8 },
		initial: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.3, delay: 1, ease: 'easeInOut' as const },
		},
		bottom: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.3, ease: 'easeInOut' as const },
		},
		middle: {
			opacity: 1,
			bottom: 0,
			y: -middleHeight,
			transition: { duration: 0.3, ease: 'easeInOut' as const },
		},
	}

	/**
	 * Effect to set the window height
	 */
	useEffect(() => {
		setWindowHeight(window.innerHeight)
	}, [])

	/**
	 * Effect to change the status of the AddRecipe component
	 */
	useEffect(() => {
		if (status === 'middle' && !enabled) setStatus('bottom')
		else setStatus(enabled ? 'middle' : 'initial')
	}, [enabled, status])

	return (
		<AnimatePresence initial={true}>
			{mode == 'recipes' && enabled && (
				<motion.div
					key='not-found'
					initial={{ opacity: 0, y: 0, scale: 0 }}
					animate={{ opacity: 1, y: topHeight, scale: 1 }}
					exit={{ opacity: 0, y: 0, scale: 0 }}>
					<div className='h-32 flex flex-col items-center justify-center text-forest-200 text-center'>
						<Utensils size={24} />
						<TypographyH4 className='mt-2 mb-5'>
							{t('no-recipes')}
						</TypographyH4>
					</div>
				</motion.div>
			)}
			{mode == 'authors' && (
				<motion.div
					key='info-authors'
					initial={{ opacity: 0, y: 0, scale: 0 }}
					animate={{ opacity: 1, y: topHeight, scale: 1 }}
					exit={{ opacity: 0, y: 0, scale: 0 }}>
					<div className='h-32 flex flex-col items-center justify-center text-forest-200 text-center'>
						{enabled ? (
							<>
								<ChefHat size={24} />
								<TypographyH4 className='mt-2 mb-5'>
									{t('no-authors')}
								</TypographyH4>
							</>
						) : (
							<>
								<ChefHat size={48} />
								<TypographyH5 className='mt-2 mb-5'>
									{t('start-author-search')}
								</TypographyH5>
							</>
						)}
					</div>
				</motion.div>
			)}
			{mode == 'recipes' && (
				<motion.div
					key='add-recipe'
					initial='hidden'
					animate={status}
					variants={variants}
					className='fixed'>
					<AddRecipe />
				</motion.div>
			)}
		</AnimatePresence>
	)
}
