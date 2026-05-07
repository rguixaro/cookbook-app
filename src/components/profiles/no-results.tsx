'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'motion/react'

export type ProfilesSearchFeedbackState = 'prompt' | 'no-results' | 'hidden'
export type ProfilesSearchFeedbackVisibleState = Exclude<
	ProfilesSearchFeedbackState,
	'hidden'
>

export const profilesSearchFeedbackMotionProps = {
	initial: { opacity: 0, y: -18, scale: 0.98 },
	animate: { opacity: 1, y: 0, scale: 1 },
	exit: { opacity: 0, y: -12, scale: 0.98 },
	transition: { type: 'spring', stiffness: 380, damping: 30 },
} as const

export function ProfilesSearchFeedbackContent({
	state,
	search,
}: {
	state: ProfilesSearchFeedbackVisibleState
	search: string
}) {
	const t = useTranslations('common')
	const tProfiles = useTranslations('ProfilesPage')
	const isNoResults = state === 'no-results'

	return (
		<>
			<div className='flex min-h-20 flex-col items-center justify-center text-forest-200 text-center'>
				<p className='mb-4 text-base font-extrabold text-forest-200 md:text-lg'>
					{isNoResults
						? t('no-users-for', { search })
						: t('start-profile-search')}
				</p>
			</div>
			{isNoResults && (
				<Link
					aria-label={tProfiles('clear-search')}
					href='/profiles'
					className='w-fit bg-forest-100 border-2 border-forest-150 hover:bg-forest-150 text-forest-300 font-bold shadow-center-sm rounded-xl px-8 py-2 flex items-center justify-center'>
					<span className='text-sm font-semibold'>
						{tProfiles('clear-search')}
					</span>
				</Link>
			)}
		</>
	)
}

export function ProfilesSearchFeedback({
	state,
	search,
}: {
	state: ProfilesSearchFeedbackState
	search: string
}) {
	return (
		<AnimatePresence mode='wait'>
			{state !== 'hidden' && (
				<motion.div
					key={state}
					{...profilesSearchFeedbackMotionProps}
					className='flex w-full flex-col items-center'>
					<ProfilesSearchFeedbackContent
						state={state}
						search={search}
					/>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

export function ProfilesNoResults({
	visible,
	search,
}: {
	visible: boolean
	search: string
}) {
	return (
		<ProfilesSearchFeedback
			state={visible ? 'no-results' : 'hidden'}
			search={search}
		/>
	)
}

export function ProfilesSearchPrompt({ visible }: { visible: boolean }) {
	return (
		<ProfilesSearchFeedback
			state={visible ? 'prompt' : 'hidden'}
			search=''
		/>
	)
}
