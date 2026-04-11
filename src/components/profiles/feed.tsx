import { getProfilesByName } from '@/server/queries'
import { Info } from '@/components/layout'
import { ItemProfile } from '@/components/profiles'

export const ProfilesFeed = async ({ searchParam }: { searchParam?: string }) => {
	const data = await getProfilesByName(searchParam || '')

	const profiles = Array.isArray(data) ? [] : (data?.profiles ?? [])

	return (
		<div className='w-full flex flex-col items-center space-y-4'>
			{profiles.map((profile) => (
				<ItemProfile
					key={profile.id}
					profile={profile}
					query={searchParam}
				/>
			))}
			{profiles.length === 0 && (
				<Info enabled={searchParam != null} mode='profiles' />
			)}
		</div>
	)
}
