'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import * as motion from 'motion/react-client';
import { AnimatePresence } from 'motion/react';
import { Utensils } from 'lucide-react';

import { TypographyH4 } from '@/ui';
import { AddRecipe } from './add';

/**
 * Header and Search bar height
 */
const headerHeight = 101;
const searchHeight = 112;
const notFoundHeight = 128;

export function Info({ enabled }: { enabled: boolean }) {
	const t = useTranslations('RecipesPage');

	const [status, setStatus] = useState<'bottom' | 'middle' | 'initial'>('initial');

	/**
	 * Y positions for the AddRecipe component
	 */
	const [windowHeight, setWindowHeight] = useState<number>(750);
	const topHeight = headerHeight + searchHeight;
	const middleHeight = windowHeight - (2 * topHeight + 5 + notFoundHeight) - 25;

	/**
	 * Motion variants for the AddRecipe component
	 */
	const variants = {
		hidden: { opacity: 0, y: 25, bottom: windowHeight / 8 },
		initial: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.3, delay: 1, ease: 'easeInOut' },
		},
		bottom: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.3, ease: 'easeInOut' },
		},
		middle: {
			opacity: 1,
			bottom: 0,
			y: -middleHeight,
			transition: { duration: 0.3, ease: 'easeInOut' },
		},
	};

	/**
	 * Effect to set the window height
	 */
	useEffect(() => {
		setWindowHeight(window.innerHeight);
	}, []);

	/**
	 * Effect to change the status of the AddRecipe component
	 */
	useEffect(() => {
		if (status === 'middle' && !enabled) setStatus('bottom');
		else setStatus(enabled ? 'middle' : 'initial');
	}, [enabled, status]);

	return (
		<AnimatePresence initial={true}>
			{enabled && (
				<motion.div
					key='not-found'
					initial={{ opacity: 0, y: 0, scale: 0 }}
					animate={{ opacity: 1, y: topHeight, scale: 1 }}
					exit={{ opacity: 0, y: 0, scale: 0 }}>
					<div className='h-32 flex flex-col items-center justify-center text-forest-200'>
						<TypographyH4>{t('no-recipes')}</TypographyH4>
						<Utensils size={24} className='mt-2 mb-5' />
					</div>
				</motion.div>
			)}
			<motion.div
				key='add-recipe'
				initial='hidden'
				animate={status}
				variants={variants}
				className='fixed'>
				<AddRecipe />
			</motion.div>
		</AnimatePresence>
	);
}
