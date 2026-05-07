'use client'

import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'motion/react'

import type { ProfileSchema } from '@/server/schemas'
import { ResultCountChip } from '@/components/layout/result-count-chip'
import { ItemProfile } from './item'
import {
	ProfilesSearchFeedbackContent,
	profilesSearchFeedbackMotionProps,
} from './no-results'

type ProfilesResultsView = 'prompt' | 'no-results' | 'results'

const profilesResultsMotionProps = {
	initial: { opacity: 0, y: 12 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -12 },
	transition: { type: 'spring', stiffness: 380, damping: 30 },
} as const

export function ProfilesResults({
	profiles,
	searchParam,
}: {
	profiles: ProfileSchema[]
	searchParam?: string
}) {
	const tProfiles = useTranslations('ProfilesPage')
	const search = searchParam?.trim() ?? ''
	const hasSearch = search.length > 0
	const view: ProfilesResultsView =
		profiles.length > 0 ? 'results' : hasSearch ? 'no-results' : 'prompt'

	return (
		<AnimatePresence mode='wait' initial={false}>
			{view === 'results' ? (
				<motion.div
					key='profiles-results'
					{...profilesResultsMotionProps}
					className='w-full flex flex-col items-center space-y-4'>
					{hasSearch && (
						<ResultCountChip
							label={tProfiles('users-count', {
								count: profiles.length,
							})}
						/>
					)}
					{profiles.map((profile) => (
						<ItemProfile
							key={profile.id}
							profile={profile}
							query={searchParam}
						/>
					))}
				</motion.div>
			) : (
				<motion.div
					key={view}
					{...profilesSearchFeedbackMotionProps}
					className='flex w-full flex-col items-center'>
					{hasSearch && (
						<ResultCountChip
							label={tProfiles('users-count', { count: 0 })}
							className='mb-2'
						/>
					)}
					<ProfilesSearchFeedbackContent
						state={view}
						search={search}
					/>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
