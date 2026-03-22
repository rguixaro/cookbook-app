import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { ChefHat, Loader, User } from 'lucide-react'

import { getProfileByUserId } from '@/server/queries'
import { GoBack } from '@/components/layout'
import { RecipesFeed, SearchRecipes } from '@/components/recipes'
import { SyncAuthorName } from '@/components/profile'
import { TypographyH4 } from '@/ui'

export default async function AuthorPage({
	params,
	searchParams,
}: {
	params: Promise<{ authorId: string }>
	searchParams?: Promise<{
		search?: string
		category?: string
		favourites?: string
	}>
}) {
	const { authorId } = await params
	const searchParam = (await searchParams)?.search
	const categoryParam = (await searchParams)?.category
	const favouritesParam = (await searchParams)?.favourites === 'true'

	const { profile } = await getProfileByUserId(authorId)
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
		<div className='flex flex-col items-center pt-2 my-2 text-forest-400 w-full'>
			<div className='w-11/12 sm:w-3/5 lg:w-3/8'>
				<GoBack />
			</div>
			{!profile ? (
				<div className='mt-32 flex flex-col items-center justify-center text-forest-200'>
					<User size={24} />
					<TypographyH4 className='mt-2 mb-w5'>
						{t_common('author-not-found')}
					</TypographyH4>
					<Link href='/' className='mt-5 underline font-medium'>
						{t_common('return')}
					</Link>
				</div>
			) : (
				<div className='flex flex-col items-center w-full'>
					<SyncAuthorName name={profile.name} />
					<div className='mb-2 mt-3 bg-forest-200/15 border-4 border-forest-200/15 rounded-2xl shadow-sm'>
						<div className='flex items-center gap-4 bg-[#fefff2] rounded-xl px-3 py-3 shadow-sm'>
							<div className='w-14 h-14 shrink-0 rounded-xl overflow-hidden shadow-sm'>
								<Image
									src={profile.image}
									referrerPolicy='no-referrer'
									alt='Profile image'
									width={56}
									height={56}
								/>
							</div>
							<div className='flex flex-col min-w-0'>
								<span className='font-extrabold font-title text-forest-300 text-base md:text-lg truncate'>
									{`@${profile.name}`}
								</span>
							</div>
						</div>
						<div className='flex items-center justify-center gap-3 px-3 py-3 text-forest-300 text-sm font-medium'>
							<div className='flex items-center gap-1'>
								<ChefHat size={14} />
								<span className='font-bold'>
									{t('recipe-count', {
										count: profile._count.recipes,
									})}
								</span>
							</div>
							<div className='bg-forest-200/40 h-0.5 w-1 rounded-2xl' />
							<span>
								{t('member-since', {
									date: profile.createdAt.toLocaleDateString(
										undefined,
										{ month: 'short', year: 'numeric' },
									),
								})}
							</span>
						</div>
					</div>
					<SearchRecipes withAvatar={false} />
					<div className='w-10/12 sm:w-2/4 lg:w-2/6'>
						<Suspense fallback={<LoadingSkeleton />}>
							<RecipesFeed
								referred
								userId={authorId}
								searchParam={searchParam}
								categoryParam={categoryParam}
								favouritesParam={favouritesParam}
							/>
						</Suspense>
					</div>
				</div>
			)}
		</div>
	)
}
