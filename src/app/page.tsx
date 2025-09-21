import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Loader } from 'lucide-react'

import { RecipesFeed, SearchRecipes } from '@/components/recipes'

export default async function RecipesPage({
	searchParams,
}: {
	searchParams?: Promise<{ search?: string; category?: string }>
}) {
	const searchParam = (await searchParams)?.search
	const categoryParam = (await searchParams)?.category
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
			<Suspense fallback={<LoadingSkeleton />}>
				<RecipesFeed
					searchParam={searchParam}
					categoryParam={categoryParam}
				/>
			</Suspense>
		</main>
	)
}
