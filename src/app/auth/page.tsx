import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { LucideIcon } from 'lucide-react'
import { BookMarked, FolderHeart, Search, Share2 } from 'lucide-react'

import { LoginIcon, SocialLogin } from '@/components/auth'

import { cn } from '@/utils'

export const metadata: Metadata = {
	title: 'Sign In - CookBook',
	description: 'Sign in to your CookBook account',
}

const loginFeatures: {
	icon: LucideIcon
	title: string
	description: string
}[] = [
	{
		icon: BookMarked,
		title: 'login-feature-save-title',
		description: 'login-feature-save-description',
	},
	{
		icon: FolderHeart,
		title: 'login-feature-organize-title',
		description: 'login-feature-organize-description',
	},
	{
		icon: Search,
		title: 'login-feature-find-title',
		description: 'login-feature-find-description',
	},
	{
		icon: Share2,
		title: 'login-feature-share-title',
		description: 'login-feature-share-description',
	},
]

export default async function LoginPage() {
	const t = await getTranslations('LoginPage')

	return (
		<div className='relative flex w-full max-w-5xl flex-col items-center justify-center'>
			<div className='pointer-events-none absolute left-0 hidden w-56 flex-col gap-10 lg:flex'>
				{loginFeatures.slice(0, 2).map((feature, index) => (
					<FeatureNote
						feature={feature}
						index={index}
						key={feature.title}
						t={t}
					/>
				))}
			</div>
			<div className='pointer-events-none absolute right-0 hidden w-56 flex-col gap-10 lg:flex'>
				{loginFeatures.slice(2).map((feature, index) => (
					<FeatureNote
						align='right'
						feature={feature}
						index={index + 2}
						key={feature.title}
						t={t}
					/>
				))}
			</div>
			<div className='mt-8 grid w-full max-w-sm gap-5 px-4 pb-8 duration-500 animate-in fade-in-30 slide-in-from-bottom-2 lg:hidden'>
				{loginFeatures.slice(2).map((feature, index) => (
					<MobileFeatureNote
						feature={feature}
						index={index + 2}
						key={feature.title}
						t={t}
					/>
				))}
			</div>
			<div className='border-8 border-forest-150 rounded-[20px] shadow-center-sm'>
				<div className='bg-forest-150'>
					<div
						className={cn(
							'w-full max-w-sm overflow-hidden bg-forest-50 rounded-xl ',
							'duration-300 animate-in fade-in-15 slide-in-from-bottom-3',
						)}>
						<div className='p-4 text-center text-forest-300'>
							<div className='flex min-h-92 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-forest-150/80 p-5'>
								<LoginIcon />
								<div className='pt-5 text-2xl font-medium duration-500 animate-in fade-in-20 md:text-3xl'>
									{t('login-to')}
									<p className='font-title text-3xl font-bold md:text-4xl'>
										{t('login-name')}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className='w-full h-2 bg-forest-150' />
				<div className='bg-forest-150'>
					<SocialLogin />
				</div>
			</div>
			<div className='mt-8 grid w-full max-w-sm gap-5 px-4 pb-8 duration-500 animate-in fade-in-30 slide-in-from-bottom-2 lg:hidden'>
				{loginFeatures.slice(2).map((feature, index) => (
					<MobileFeatureNote
						feature={feature}
						index={index + 2}
						key={feature.title}
						t={t}
					/>
				))}
			</div>
		</div>
	)
}

function MobileFeatureNote({
	feature,
	index,
	t,
}: {
	feature: (typeof loginFeatures)[number]
	index: number
	t: Awaited<ReturnType<typeof getTranslations>>
}) {
	const Icon = feature.icon

	return (
		<div className='grid grid-cols-[2.75rem_1fr] gap-3 border-t-2 border-forest-150 py-4 text-forest-300'>
			<span className='mt-1 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-forest-150 bg-forest-50 text-forest-300'>
				<Icon size={17} strokeWidth={2.4} />
			</span>
			<span className='min-w-0'>
				<span className='flex items-baseline gap-2'>
					<span className='text-xs font-extrabold leading-4 text-forest-200'>
						{String(index + 1).padStart(2, '0')}
					</span>
					<span className='text-sm font-extrabold leading-5 text-forest-400'>
						{t(feature.title)}
					</span>
				</span>
				<span className='mt-1 block text-xs font-semibold leading-5 text-forest-200'>
					{t(feature.description)}
				</span>
			</span>
		</div>
	)
}

function FeatureNote({
	align = 'left',
	feature,
	index,
	t,
}: {
	align?: 'left' | 'right'
	feature: (typeof loginFeatures)[number]
	index: number
	t: Awaited<ReturnType<typeof getTranslations>>
}) {
	const Icon = feature.icon

	return (
		<div
			className={cn(
				'flex gap-3 text-forest-300',
				align === 'right' && 'flex-row-reverse text-right',
			)}>
			<span className='mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-forest-150 bg-forest-50 text-forest-300'>
				<Icon size={17} strokeWidth={2.4} />
			</span>
			<span className='min-w-0 border-t-2 border-forest-150 pt-2'>
				<span className='block text-xs font-extrabold uppercase leading-4 text-forest-200'>
					{String(index + 1).padStart(2, '0')}
				</span>
				<span className='mt-1 block text-sm font-extrabold leading-5 text-forest-400'>
					{t(feature.title)}
				</span>
				<span className='mt-1 block text-xs font-semibold leading-5 text-forest-200'>
					{t(feature.description)}
				</span>
			</span>
		</div>
	)
}
