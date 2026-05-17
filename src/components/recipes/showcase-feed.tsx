'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'motion/react'
import { Loader, Utensils } from 'lucide-react'

import { fetchShowcaseRecipes } from '@/server/actions'
import { useInfiniteScroll } from '@/hooks'
import { ResultCountChip } from '@/components/layout/result-count-chip'
import { ItemRecipe } from '@/components/recipes/item'
import {
	RecipesNoResultsContent,
	recipesNoResultsMotionProps,
} from '@/components/recipes/no-results'
import {
	RecipeSkeleton,
	recipesFeedMotionProps,
	recipesSkeletonMotionProps,
} from '@/components/recipes/feed'
import { TypographyH4 } from '@/ui'
import { cn } from '@/utils'
import type { RecipeSchema } from '@/server/schemas'

type ShowcaseFeedState = 'loading-empty' | 'results' | 'search-empty' | 'empty'

export function ShowcaseRecipesFeed({
	searchParam,
	courseParam,
	categoriesParam,
	sortParam,
	take = 3,
	showHeader = true,
	showResultCount = false,
	showEmptyState = false,
	enableInfiniteScroll = false,
	className,
}: {
	searchParam?: string
	courseParam?: string
	categoriesParam?: string
	sortParam?: string
	take?: number
	showHeader?: boolean
	showResultCount?: boolean
	showEmptyState?: boolean
	enableInfiniteScroll?: boolean
	className?: string
}) {
	const t = useTranslations('common')
	const tRecipes = useTranslations('RecipesPage')
	const [recipes, setRecipes] = useState<RecipeSchema[]>([])
	const [nextCursor, setNextCursor] = useState<string | null>(null)
	const [totalCount, setTotalCount] = useState(0)
	const [isLoading, setIsLoading] = useState(true)
	const fetchIdRef = useRef(0)
	const isFetchingMoreRef = useRef(false)
	const search = searchParam?.trim() ?? ''
	const hasActiveListQuery =
		search.length > 0 ||
		Boolean(courseParam?.trim()) ||
		Boolean(categoriesParam?.trim()) ||
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
				const result = await fetchShowcaseRecipes({
					cursor: cursor ?? undefined,
					search: searchParam,
					course: courseParam,
					categories: categoriesParam,
					sort: sortParam,
					take,
				})

				if (fetchIdRef.current !== id) return

				setRecipes((prev) => {
					const combined = cursor
						? [...prev, ...result.recipes]
						: result.recipes
					const seen = new Set<string>()
					return combined.filter((recipe) =>
						seen.has(recipe.id) ? false : seen.add(recipe.id) && true,
					)
				})
				setNextCursor(result.nextCursor)
				setTotalCount(result.totalCount)
			} finally {
				if (isCursorPage) isFetchingMoreRef.current = false
				if (fetchIdRef.current === id) setIsLoading(false)
			}
		},
		[searchParam, courseParam, categoriesParam, sortParam, take],
	)

	useEffect(() => {
		setRecipes([])
		setNextCursor(null)
		setTotalCount(0)
		loadPage()
	}, [loadPage])

	const loadMore = useCallback(() => {
		if (
			!enableInfiniteScroll ||
			!hasMore ||
			isLoading ||
			isFetchingMoreRef.current
		)
			return
		loadPage(nextCursor!)
	}, [enableInfiniteScroll, hasMore, isLoading, nextCursor, loadPage])

	const sentinelRef = useInfiniteScroll(
		loadMore,
		enableInfiniteScroll && hasMore && !isLoading,
	)

	const isFirstPageLoading = isLoading && recipes.length === 0
	const feedState: ShowcaseFeedState = isFirstPageLoading
		? 'loading-empty'
		: recipes.length > 0
			? 'results'
			: hasActiveListQuery
				? 'search-empty'
				: 'empty'
	const previousFeedStateRef = useRef<ShowcaseFeedState>(feedState)
	const previousFeedState = previousFeedStateRef.current
	const isSkeletonHandoff =
		previousFeedState === 'loading-empty' && feedState !== 'loading-empty'
	const shouldRender =
		isFirstPageLoading || recipes.length > 0 || showEmptyState

	useEffect(() => {
		previousFeedStateRef.current = feedState
	}, [feedState])

	if (!shouldRender) return null

	return (
		<section className={cn('w-full', className)}>
			{showHeader && (
				<div className='mb-2 flex items-center justify-between px-1'>
					<h2 className='text-base sm:text-lg font-black text-forest-200'>
						{tRecipes('showcase-title')}
					</h2>
					<Link
						href='/discover'
						className='text-xs sm:text-base font-bold text-forest-200 hover:text-forest-300'>
						{tRecipes('showcase-see-all')}
					</Link>
				</div>
			)}
			<div className='w-full h-full flex flex-col items-center'>
				{showResultCount && (
					<ResultCountChip
						label={tRecipes('recipe-count', { count: totalCount })}
						loading={isFirstPageLoading}
						loadingLabel={tRecipes('searching')}
						reserveLabel={tRecipes('recipe-count', { count: 1 })}
						className='mb-2'
					/>
				)}
				<AnimatePresence mode='wait' initial={false}>
					{feedState === 'loading-empty' && (
						<motion.div
							key='showcase-loading-empty'
							{...recipesSkeletonMotionProps}
							className='w-full'>
							{Array.from({ length: Math.min(take, 5) }).map((_, index) => (
								<RecipeSkeleton key={index} />
							))}
						</motion.div>
					)}
					{feedState === 'results' && (
						<motion.div
							key='showcase-results'
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
									query={searchParam}
									course={courseParam}
									categories={categoriesParam}
									sort={sortParam}
								/>
							))}
							{isLoading && (
								<div className='flex flex-col mt-3 justify-center items-center text-forest-200'>
									<Loader size={18} className='animate-spin' />
								</div>
							)}
							{enableInfiniteScroll && <div ref={sentinelRef} />}
						</motion.div>
					)}
					{feedState === 'search-empty' && showEmptyState && (
						<motion.div
							key='showcase-search-empty'
							{...recipesNoResultsMotionProps}
							className='flex w-full flex-col items-center'>
							<RecipesNoResultsContent
								search={search}
								showCreate={false}
							/>
						</motion.div>
					)}
					{feedState === 'empty' && showEmptyState && (
						<motion.div
							key='showcase-empty'
							{...recipesFeedMotionProps}
							initial={
								isSkeletonHandoff
									? false
									: recipesFeedMotionProps.initial
							}
							className='w-full flex flex-col items-center'>
							<div className='mt-10 h-32 flex flex-col items-center justify-center text-forest-200 text-center'>
								<Utensils size={48} />
								<TypographyH4 className='mt-2 mb-5'>
									{t('no-recipes')}
								</TypographyH4>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</section>
	)
}
