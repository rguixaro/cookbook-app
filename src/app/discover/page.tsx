import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import { GoBack } from '@/components/layout'
import { SearchRecipes, ShowcaseRecipesFeed } from '@/components/recipes'
import { SITE_URL } from '@/utils'

export const metadata: Metadata = {
	title: 'Discover',
	description: 'Traditional showcase recipes from CookBook.',
	alternates: { canonical: new URL('/discover', SITE_URL).toString() },
}

export default async function DiscoverPage({
	searchParams,
}: {
	searchParams?: Promise<{
		search?: string
		course?: string
		categories?: string
		sort?: string
	}>
}) {
	const session = await auth()
	if (!session) redirect('/auth?callbackUrl=%2Fdiscover')

	const params = await searchParams
	const searchParam = params?.search
	const courseParam = params?.course
	const categoriesParam = params?.categories
	const sortParam = params?.sort

	return (
		<main className='flex flex-col items-center mt-5 w-full duration-500 animate-in fade-in-5 slide-in-from-bottom-2 text-forest-400'>
			<div className='w-11/12 sm:w-3/5 lg:w-3/8'>
				<GoBack />
			</div>
			<SearchRecipes withAvatar={false} showListFilter={false} />
			<div className='w-10/12 sm:w-2/4 lg:w-2/6'>
				<ShowcaseRecipesFeed
					searchParam={searchParam}
					courseParam={courseParam}
					categoriesParam={categoriesParam}
					sortParam={sortParam}
					take={10}
					showHeader={false}
					showResultCount
					showEmptyState
					enableInfiniteScroll
				/>
			</div>
		</main>
	)
}
