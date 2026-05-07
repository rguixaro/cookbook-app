'use client'

import { useTranslations } from 'next-intl'

import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	buttonVariants,
} from '@/ui'
import { cn } from '@/utils'

interface RecipeInfoProps {
	createdAt: string
	isOwner?: boolean
	updatedAt?: string
	savedCount?: number
	favouriteCount?: number
}

export function RecipeInfo({
	createdAt,
	isOwner = false,
	updatedAt,
	savedCount = 0,
	favouriteCount = 0,
}: RecipeInfoProps) {
	const t = useTranslations('RecipesPage')

	const stats = [
		{
			label: t('recipe-info-created'),
			value: createdAt,
		},
	]
	if (isOwner) {
		stats.push(
			{
				label: t('recipe-info-updated'),
				value: updatedAt ?? createdAt,
			},
			{
				label: t('recipe-info-saved'),
				value: t('recipe-info-saved-count', { count: savedCount }),
			},
			{
				label: t('recipe-info-favourited'),
				value: t('recipe-info-favourited-count', { count: favouriteCount }),
			},
		)
	}

	return (
		<Dialog>
			<DialogTrigger
				type='button'
				className={cn(
					buttonVariants({ variant: 'ghost' }),
					'h-auto px-2 py-1 text-xs font-semibold text-forest-400 hover:bg-transparent hover:text-forest-500',
				)}>
				{t('recipe-info')}
			</DialogTrigger>
			<DialogContent
				className={cn(
					'recipe-info-sheet left-0 top-auto bottom-0 w-full max-w-none translate-x-0 translate-y-0 gap-3 overflow-hidden rounded-b-none rounded-t-4xl border border-forest-100 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-1 shadow-center outline-none [&>button]:hidden',
					'sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:w-3/4 sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:gap-4 sm:rounded-3xl sm:border-8 sm:border-forest-150 sm:p-6 sm:shadow-center-lg sm:[&>button]:block',
				)}>
				<div className='flex shrink-0 justify-center pb-2 pt-1 sm:hidden'>
					<DialogClose
						type='button'
						aria-label={t('recipe-info-close')}
						className='flex h-8 w-full items-center justify-center'>
						<span className='h-1.5 w-12 rounded-full bg-forest-150' />
					</DialogClose>
				</div>
				<DialogHeader>
					<DialogTitle>{t('recipe-info-title')}</DialogTitle>
					<DialogDescription>
						{t(
							isOwner
								? 'recipe-info-description'
								: 'recipe-info-public-description',
						)}
					</DialogDescription>
				</DialogHeader>
				<div className='grid gap-2 text-forest-400 sm:grid-cols-2'>
					{stats.map((stat) => (
						<div
							key={stat.label}
							className='rounded-[20px] bg-forest-100 p-3 text-center shadow-center-sm'>
							<p className='text-sm font-extrabold text-forest-300'>
								{stat.label}
							</p>
							<p className='mt-2 rounded-xl bg-forest-50 px-3 py-2 text-xs font-semibold text-forest-200 shadow-center-sm'>
								{stat.value}
							</p>
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}
