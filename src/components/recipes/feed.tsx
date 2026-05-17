'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'motion/react'
import { Loader, LoaderIcon, Utensils } from 'lucide-react'

import { fetchRecipes } from '@/server/actions'
import { useInfiniteScroll } from '@/hooks'
import { Info } from '@/components/layout'
import { ResultCountChip } from '@/components/layout/result-count-chip'
import { ItemRecipe } from '@/components/recipes/item'
import { AddRecipe } from '@/components/recipes/add'
import {
	RecipesNoResultsContent,
	recipesNoResultsMotionProps,
} from '@/components/recipes/no-results'
import { TypographyH4 } from '@/ui'
import type { RecipeSchema } from '@/server/schemas'

type RecipesFeedState = 'loading-empty' | 'results' | 'search-empty' | 'empty'

export const recipesFeedMotionProps = {
	initial: { opacity: 0, y: 12 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -12 },
	transition: { type: 'spring', stiffness: 380, damping: 30 },
} as const

export const recipesSkeletonMotionProps = {
	initial: false,
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: 0 },
	transition: { duration: 0 },
} as const

export function RecipeSkeleton() {
	return (
		<div className='w-full my-2 flex shadow-center-sm bg-forest-100 border-8 border-forest-150 rounded-2xl overflow-hidden animate-pulse'>
			<div className='flex flex-col flex-1 min-w-0'>
				<div className='flex items-center w-full bg-forest-50 px-4 py-3 rounded-l-xl shadow-center-sm'>
					<div className='w-6 h-6 bg-forest-150 rounded' />
					<div className='ms-2 h-4 w-2/3 bg-forest-150 rounded' />
				</div>
				<div className='flex flex-wrap gap-1.5 px-3 py-2.5'>
					{[1, 2, 3].map((i) => (
						<div key={i} className='h-5 w-16 bg-forest-150 rounded-lg' />
					))}
				</div>
			</div>
			<div className='w-28 shrink-0 bg-forest-150 flex items-center justify-center'>
				<LoaderIcon size={24} className='animate-spin' />
			</div>
		</div>
	)
}

export const RecipesFeed = ({
	searchParam,
	courseParam,
	categoriesParam,
	favouritesParam,
	savedParam,
	sortParam,
	userId,
	referred = false,
	searchParamName = 'search',
	profileSearchParam,
	emptyStateFooter,
	endOfFeedFooter,
}: {
	searchParam?: string
	courseParam?: string
	categoriesParam?: string
	favouritesParam?: boolean
	savedParam?: boolean
	sortParam?: string
	userId?: string
	referred?: boolean
	searchParamName?: string
	profileSearchParam?: string
	emptyStateFooter?: ReactNode
	endOfFeedFooter?: ReactNode
}) => {
	const t = useTranslations('common')
	const tRecipes = useTranslations('RecipesPage')
	const [recipes, setRecipes] = useState<RecipeSchema[]>([])
	const [nextCursor, setNextCursor] = useState<string | null>(null)
	const [totalCount, setTotalCount] = useState(0)
	const [isLoading, setIsLoading] = useState(true)
	const fetchIdRef = useRef(0)
	const isFetchingMoreRef = useRef(false)
	const search = searchParam?.trim() ?? ''
	const hasSearch = search.length > 0
	const hasActiveListQuery =
		hasSearch ||
		Boolean(courseParam?.trim()) ||
		Boolean(categoriesParam?.trim()) ||
		Boolean(favouritesParam) ||
		Boolean(savedParam) ||
		Boolean(sortParam?.trim())

	const hasMore = nextCursor !== null

	const loadPage = useCallback(
		async (cursor?: string) => {
			const isCursorPage = Boolean(cursor)
			if (isCursorPage && isFetchingMoreRef.current) return
			if (isCursorPage) isFetchingMoreRef.current = true

			const id = ++fetchIdRef.current
			setIsLoading(true)

			try {
				const result = await fetchRecipes({
					cursor: cursor ?? undefined,
					search: searchParam,
					course: courseParam,
					categories: categoriesParam,
					favourites: favouritesParam,
					saved: savedParam,
					sort: sortParam,
					userId,
				})

				if (fetchIdRef.current !== id) return

				setRecipes((prev) => {
					const combined = cursor
						? [...prev, ...result.recipes]
						: result.recipes
					const seen = new Set<string>()
					return combined.filter((r) =>
						seen.has(r.id) ? false : seen.add(r.id) && true,
					)
				})
				setNextCursor(result.nextCursor)
				setTotalCount(result.totalCount)
			} finally {
				if (isCursorPage) isFetchingMoreRef.current = false
				if (fetchIdRef.current === id) setIsLoading(false)
			}
		},
		[
			searchParam,
			courseParam,
			categoriesParam,
			favouritesParam,
			savedParam,
			sortParam,
			userId,
		],
	)

	useEffect(() => {
		setRecipes([])
		setNextCursor(null)
		setTotalCount(0)
		loadPage()
	}, [loadPage])

	const loadMore = useCallback(() => {
		if (!hasMore || isLoading || isFetchingMoreRef.current) return
		loadPage(nextCursor!)
	}, [hasMore, isLoading, nextCursor, loadPage])

	const sentinelRef = useInfiniteScroll(loadMore, hasMore && !isLoading)

	const isFirstPageLoading = isLoading && recipes.length === 0
	const isEmpty = recipes.length === 0 && !isLoading
	const feedState: RecipesFeedState = isFirstPageLoading
		? 'loading-empty'
		: recipes.length > 0
			? 'results'
			: hasActiveListQuery
				? 'search-empty'
				: 'empty'
	const shouldShowFloatingAddRecipe = !referred && feedState === 'results'
	const previousFeedStateRef = useRef<RecipesFeedState>(feedState)
	const previousFeedState = previousFeedStateRef.current
	const isSkeletonHandoff =
		previousFeedState === 'loading-empty' && feedState !== 'loading-empty'

	useEffect(() => {
		previousFeedStateRef.current = feedState
	}, [feedState])

	return (
		<div className='w-full h-full flex flex-col items-center'>
			<ResultCountChip
				label={tRecipes('recipe-count', { count: totalCount })}
				loading={isFirstPageLoading}
				loadingLabel={tRecipes('searching')}
				reserveLabel={tRecipes('recipe-count', { count: 1 })}
				className='mb-2'
			/>
			<AnimatePresence mode='wait' initial={false}>
				{feedState === 'loading-empty' && (
					<motion.div
						key='recipes-loading-empty'
						{...recipesSkeletonMotionProps}
						className='w-full'>
						<RecipeSkeleton />
						<RecipeSkeleton />
						<RecipeSkeleton />
						<RecipeSkeleton />
						<RecipeSkeleton />
					</motion.div>
				)}
				{feedState === 'results' && (
					<motion.div
						key='recipes-results'
						{...recipesFeedMotionProps}
						initial={
							isSkeletonHandoff
								? false
								: recipesFeedMotionProps.initial
						}
						className='w-full flex flex-col items-center pb-4'>
						{recipes.map((recipe) => (
							<ItemRecipe
								key={recipe.id}
								recipe={recipe}
								referred={referred}
								query={searchParam}
								searchParamName={searchParamName}
								profileSearchParam={profileSearchParam}
								course={courseParam}
								categories={categoriesParam}
								favourites={favouritesParam}
								saved={savedParam}
								sort={sortParam}
							/>
						))}
							{isLoading && (
								<div className='flex flex-col mt-3 justify-center items-center text-forest-200'>
									<Loader size={18} className='animate-spin' />
								</div>
							)}
							<div ref={sentinelRef} />
							{!hasMore && !isLoading && endOfFeedFooter}
						</motion.div>
					)}
				{feedState === 'search-empty' && (
					<motion.div
						key='recipes-search-empty'
						{...recipesNoResultsMotionProps}
						className='flex w-full flex-col items-center'>
						<RecipesNoResultsContent
							search={search}
							showCreate={!referred}
							searchParamName={searchParamName}
						/>
					</motion.div>
				)}
				{feedState === 'empty' && (
					<motion.div
						key='recipes-empty'
						{...recipesFeedMotionProps}
						initial={
							isSkeletonHandoff
								? false
								: recipesFeedMotionProps.initial
						}
						className='w-full flex flex-col items-center'>
						{referred ? (
							<div className='mt-10 h-32 flex flex-col items-center justify-center text-forest-200 text-center'>
								<Utensils size={48} />
								<TypographyH4 className='mt-2 mb-5'>
									{t('no-recipes')}
								</TypographyH4>
							</div>
						) : (
							<div className='mt-10 flex min-h-32 flex-col items-center justify-center text-forest-200 text-center'>
								<Utensils size={48} />
								<TypographyH4 className='mt-2 mb-5'>
									{tRecipes('empty-create-prompt')}
								</TypographyH4>
								<AddRecipe className='rounded-xl px-8 py-2 shadow-center-sm' />
							</div>
						)}
						{!referred && emptyStateFooter}
					</motion.div>
				)}
			</AnimatePresence>
			{shouldShowFloatingAddRecipe && <Info enabled={false} mode='recipes' />}
		</div>
	)
}
