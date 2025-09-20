import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Loader, User } from 'lucide-react'

import { getProfileByUserId } from '@/server/queries'
import { GoBack } from '@/components/layout/go-back'
import { SearchRecipes } from '@/components/recipes/search'
import { RecipesFeed } from '@/components/recipes/feed'
import { TypographyH4 } from '@/ui'

export default async function ProfilePage({
	params,
	searchParams,
}: {
	params: Promise<{ userId: string }>
	searchParams?: Promise<{ search?: string; category?: string }>
}) {
	const { userId } = await params
	const searchParam = (await searchParams)?.search
	const categoryParam = (await searchParams)?.category

	const { profile } = await getProfileByUserId(userId)
	const t = await getTranslations('RecipesPage')
	const t_common = await getTranslations('common')

	const LoadingSkeleton = () => {
		return (
			<div className='flex flex-col mt-5 justify-center items-center text-forest-200'>
				<Loader size={18} className='animate-spin' />
				<span className='font-bold mt-3'>{t('searching')}</span>
			</div>
		)
	}

	return (
		<div className='flex flex-col pt-2 my-2 text-forest-400'>
			<GoBack />
			{!profile ? (
				<div className='mt-32 flex flex-col items-center justify-center text-forest-200'>
					<User size={24} />
					<TypographyH4 className='mt-2 mb-5'>
						{t_common('user-not-found')}
					</TypographyH4>
					<Link href='/' className='mt-5 underline font-medium'>
						{t_common('return')}
					</Link>
				</div>
			) : (
				<div>
					<div className='flex flex-col items-center justify-center space-y-3 mb-5'>
						<div className='w-20 h-20 rounded overflow-hidden shadow border-4 border-forest-200'>
							<Image
								src={profile.image}
								referrerPolicy='no-referrer'
								alt='Profile image'
								width={80}
								height={80}
							/>
						</div>
						<span className='font-bold text-lg md:text-xl'>
							{profile.name}
						</span>
					</div>
					<div>
						<SearchRecipes withAvatar={false} />
						<Suspense fallback={<LoadingSkeleton />}>
							<RecipesFeed
								referred
								userId={userId}
								searchParam={searchParam}
								categoryParam={categoryParam}
							/>
						</Suspense>
					</div>
					{/* )} */}
				</div>
			)}
		</div>
	)
}
