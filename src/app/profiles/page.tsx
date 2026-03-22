import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Loader } from 'lucide-react'

import { GoBack } from '@/components/layout'
import { ProfilesFeed, SearchProfiles } from '@/components/profiles'

export default async function ProfilesPage({
	searchParams,
}: {
	searchParams?: Promise<{ search?: string; category?: string }>
}) {
	const searchParam = (await searchParams)?.search
	const t = await getTranslations('ProfilesPage')

	const LoadingSkeleton = () => {
		return (
			<div className='flex flex-col mt-5 justify-center items-center text-forest-200'>
				<Loader size={18} className='animate-spin' />
				<span className='font-bold mt-3'>{t('searching')}</span>
			</div>
		)
	}

	return (
		<div className='flex flex-col items-center mt-5 w-full duration-500 animate-in fade-in-5 slide-in-from-bottom-2'>
			<div className='w-11/12 sm:w-3/5 lg:w-3/8'>
				<GoBack />
			</div>
			<div className='w-10/12 sm:w-2/4 lg:w-2/6'>
				<SearchProfiles />
				<Suspense fallback={<LoadingSkeleton />}>
					<ProfilesFeed searchParam={searchParam} />
				</Suspense>
			</div>
		</div>
	)
}
