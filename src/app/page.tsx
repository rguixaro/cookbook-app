import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Loader } from 'lucide-react'

import { RecipesFeed, SearchRecipes } from '@/components/recipes'

export default async function RecipesPage({
	searchParams,
}: {
	searchParams?: Promise<{
		search?: string
		category?: string
		favourites?: string
	}>
}) {
	const params = await searchParams
	const searchParam = params?.search
	const categoryParam = params?.category
	const favouritesParam = params?.favourites === 'true'
	const t = await getTranslations('RecipesPage')

	const LoadingSkeleton = () => {
		return (
			<div className='flex flex-col mt-5 justify-center items-center text-forest-200'>
				<Loader size={18} className='animate-spin' />
				<span className='font-bold mt-3'>{t('searching')}</span>
			</div>
		)
	}

	return (
		<main className='flex flex-col items-center text-forest-400 w-full h-full'>
			<SearchRecipes />
			<div className='w-10/12 sm:w-2/4 lg:w-2/6'>
				<Suspense fallback={<LoadingSkeleton />}>
					<RecipesFeed
						searchParam={searchParam}
						categoryParam={categoryParam}
						favouritesParam={favouritesParam}
					/>
				</Suspense>
			</div>
		</main>
	)
}
