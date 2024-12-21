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
const HeaderHeight = 101;
const SearchHeight = 64;
const NotFoundHeight = 128;
const TopHeight = HeaderHeight + SearchHeight;
const WindowHeight = window?.innerHeight;
const MiddleHeight = WindowHeight - (2 * TopHeight + 5 + NotFoundHeight) - 25;

export function Info({ enabled }: { enabled: boolean }) {
	const t = useTranslations('RecipesPage');

	const [status, setStatus] = useState<'bottom' | 'middle' | 'initial'>('initial');

	const variants = {
		hidden: { opacity: 0, y: 25, bottom: WindowHeight / 8 },
		initial: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.3, delay: 1, ease: 'easeInOut' },
		},
		bottom: { opacity: 1, y: 0 },
		middle: { opacity: 1, bottom: 0, y: -MiddleHeight },
	};

	useEffect(() => {
		if (status === 'middle' && !enabled) setStatus('bottom');
		else setStatus(enabled ? 'middle' : 'initial');
	}, [enabled]);

	return (
		<AnimatePresence initial={true}>
			{enabled && (
				<motion.div
					key='not-found'
					initial={{ opacity: 0, y: 0, scale: 0 }}
					animate={{ opacity: 1, y: TopHeight, scale: 1 }}
					exit={{ opacity: 0, y: 0, scale: 0 }}>
					<div className='h-32 flex flex-col items-center justify-center text-forest-200'>
						<TypographyH4>{t('not-found')}</TypographyH4>
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
