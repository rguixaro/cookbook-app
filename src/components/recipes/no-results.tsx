'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'motion/react'

import { AddRecipe } from './add'

export const recipesNoResultsMotionProps = {
	initial: { opacity: 0, y: -18, scale: 0.98 },
	animate: { opacity: 1, y: 0, scale: 1 },
	exit: { opacity: 0, y: -12, scale: 0.98 },
	transition: { type: 'spring', stiffness: 380, damping: 30 },
} as const

const recipeFilterParams = ['course', 'categories', 'favourites', 'saved', 'sort']

export function RecipesNoResultsContent({
	search,
	showCreate = false,
	searchParamName = 'search',
}: {
	search: string
	showCreate?: boolean
	searchParamName?: string
}) {
	const t = useTranslations('common')
	const tRecipes = useTranslations('RecipesPage')
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const searchTerm = search.trim()
	const hasFilters = recipeFilterParams.some((param) => searchParams.has(param))
	const clearLabelKey =
		searchTerm && hasFilters
			? 'clear-all'
			: searchTerm
				? 'clear-search'
				: 'clear-filters'

	const clearHref = useMemo(() => {
		const params = new URLSearchParams(searchParams.toString())

		if (searchTerm) params.delete(searchParamName)
		if (!searchTerm || hasFilters) {
			recipeFilterParams.forEach((param) => params.delete(param))
		}

		const query = params.toString()
		return query ? `${pathname}?${query}` : pathname
	}, [hasFilters, pathname, searchParamName, searchParams, searchTerm])

	return (
		<>
			<div className='flex min-h-20 flex-col items-center justify-center text-forest-200 text-center'>
				<p className='mb-4 text-base font-extrabold text-forest-200 md:text-lg'>
					{searchTerm
						? t('no-recipes-for', { search: searchTerm })
						: t('no-recipes')}
				</p>
			</div>
			<div className='flex flex-wrap items-center justify-center gap-2'>
				<Link
					aria-label={tRecipes(clearLabelKey)}
					href={clearHref}
					className='w-fit bg-forest-100 border-2 border-forest-150 hover:bg-forest-150 text-forest-300 font-bold shadow-center-sm rounded-xl px-8 py-2 flex items-center justify-center'>
					<span className='text-sm font-semibold'>
						{tRecipes(clearLabelKey)}
					</span>
				</Link>
				{showCreate && (
					<AddRecipe className='rounded-xl px-8 py-2 shadow-center-sm' />
				)}
			</div>
		</>
	)
}

export function RecipesNoResults({
	visible,
	search,
	showCreate = false,
	searchParamName = 'search',
}: {
	visible: boolean
	search: string
	showCreate?: boolean
	searchParamName?: string
}) {
	return (
		<AnimatePresence mode='wait'>
			{visible && (
				<motion.div
					key='recipes-no-results'
					{...recipesNoResultsMotionProps}
					className='flex w-full flex-col items-center'>
					<RecipesNoResultsContent
						search={search}
						showCreate={showCreate}
						searchParamName={searchParamName}
					/>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
