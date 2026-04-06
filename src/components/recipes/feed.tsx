'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader, LoaderIcon, Utensils } from 'lucide-react'

import { fetchRecipes } from '@/server/actions'
import { useInfiniteScroll } from '@/hooks'
import { Info } from '@/components/layout'
import { ItemRecipe } from '@/components/recipes/item'
import { TypographyH4 } from '@/ui'
import type { RecipeSchema } from '@/server/schemas'

function RecipeSkeleton() {
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
	categoryParam,
	favouritesParam,
	userId,
	referred = false,
}: {
	searchParam?: string
	categoryParam?: string
	favouritesParam?: boolean
	userId?: string
	referred?: boolean
}) => {
	const t = useTranslations('common')
	const [recipes, setRecipes] = useState<RecipeSchema[]>([])
	const [nextCursor, setNextCursor] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const fetchIdRef = useRef(0)

	const hasMore = nextCursor !== null

	const loadPage = useCallback(
		async (cursor?: string) => {
			const id = ++fetchIdRef.current
			if (!cursor) setIsLoading(true)

			const result = await fetchRecipes({
				cursor: cursor ?? undefined,
				search: searchParam,
				category: categoryParam,
				favourites: favouritesParam,
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
			setIsLoading(false)
		},
		[searchParam, categoryParam, favouritesParam, userId],
	)

	useEffect(() => {
		setRecipes([])
		setNextCursor(null)
		loadPage()
	}, [loadPage])

	const loadMore = useCallback(() => {
		if (!hasMore || isLoading) return
		loadPage(nextCursor!)
	}, [hasMore, isLoading, nextCursor, loadPage])

	const sentinelRef = useInfiniteScroll(loadMore, hasMore && !isLoading)

	const isEmpty = recipes.length === 0 && !isLoading

	return (
		<div className='w-full h-full flex flex-col items-center'>
			{recipes.map((recipe) => (
				<ItemRecipe
					key={recipe.id}
					recipe={recipe}
					referred={referred}
					query={searchParam}
					category={categoryParam}
				/>
			))}

			{/* Loading skeletons */}
			{isLoading && (
				<>
					{recipes.length === 0 ? (
						<>
							<RecipeSkeleton />
							<RecipeSkeleton />
							<RecipeSkeleton />
							<RecipeSkeleton />
							<RecipeSkeleton />
						</>
					) : (
						<div className='flex flex-col mt-3 justify-center items-center text-forest-200'>
							<Loader size={18} className='animate-spin' />
						</div>
					)}
				</>
			)}

			{/* Scroll sentinel */}
			<div ref={sentinelRef} />

			{/* Empty states */}
			{referred ? (
				isEmpty && (
					<div className='mt-10 h-32 flex flex-col items-center justify-center text-forest-200 text-center'>
						<Utensils size={24} />
						<TypographyH4 className='mt-2 mb-5'>
							{t('no-recipes')}
						</TypographyH4>
					</div>
				)
			) : (
				<Info enabled={isEmpty} mode='recipes' />
			)}
		</div>
	)
}
