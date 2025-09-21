import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Loader } from 'lucide-react'

import { GoBack } from '@/components/layout'
import { AuthorsFeed, SearchAuthors } from '@/components/authors'

export default async function AuthorsPage({
	searchParams,
}: {
	searchParams?: Promise<{ search?: string; category?: string }>
}) {
	const searchParam = (await searchParams)?.search
	const t = await getTranslations('AuthorsPage')

	const LoadingSkeleton = () => {
		return (
			<div className='flex flex-col mt-5 justify-center items-center text-forest-200'>
				<Loader size={18} className='animate-spin' />
				<span className='font-bold mt-3'>{t('searching')}</span>
			</div>
		)
	}

	return (
		<div className='mt-5 duration-500 animate-in fade-in-5 slide-in-from-bottom-2'>
			<GoBack />
			<SearchAuthors />
			<Suspense fallback={<LoadingSkeleton />}>
				<AuthorsFeed searchParam={searchParam} />
			</Suspense>
		</div>
	)
}
