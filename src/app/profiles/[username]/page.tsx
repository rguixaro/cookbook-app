import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ChefHat } from 'lucide-react'

import { getProfileByUsername } from '@/server/queries'

export async function generateMetadata({
	params,
}: {
	params: Promise<{ username: string }>
}): Promise<Metadata> {
	const { username } = await params
	const { profile } = await getProfileByUsername(username)
	if (!profile) return { title: 'Profile Not Found — CookBook' }
	return {
		title: `@${profile.name} — CookBook`,
		description: `View ${profile.name}'s recipes on CookBook`,
		openGraph: {
			title: `@${profile.name} — CookBook`,
			description: `View ${profile.name}'s recipes on CookBook`,
			images: profile.image ? [profile.image] : [],
		},
	}
}
import { GoBack } from '@/components/layout'
import { RecipesFeed, SearchRecipes } from '@/components/recipes'
import { SyncProfileName } from '@/components/profile'

export default async function ProfilePage({
	params,
	searchParams,
}: {
	params: Promise<{ username: string }>
	searchParams?: Promise<{
		search?: string
		category?: string
		favourites?: string
	}>
}) {
	const { username } = await params
	const searchParam = (await searchParams)?.search
	const categoryParam = (await searchParams)?.category
	const favouritesParam = (await searchParams)?.favourites === 'true'

	const { profile } = await getProfileByUsername(username)
	if (!profile) notFound()

	const t = await getTranslations('RecipesPage')

	return (
		<div className='flex flex-col items-center pt-2 my-2 text-forest-400 w-full'>
			<div className='w-11/12 sm:w-3/5 lg:w-3/8'>
				<GoBack />
			</div>
			<div className='flex flex-col items-center w-full'>
				<SyncProfileName name={profile.name ?? ''} />
				<div className='mb-2 mt-3 bg-forest-200/15 border-4 border-forest-200/15 rounded-2xl shadow-sm'>
					<div className='flex items-center gap-4 bg-[#fefff2] rounded-xl px-3 py-3 shadow-sm'>
						<div className='w-14 h-14 shrink-0 rounded-xl overflow-hidden shadow-sm'>
							<Image
								src={profile.image ?? ''}
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
					<RecipesFeed
						referred
						userId={profile.id}
						searchParam={searchParam}
						categoryParam={categoryParam}
						favouritesParam={favouritesParam}
					/>
				</div>
			</div>
		</div>
	)
}
