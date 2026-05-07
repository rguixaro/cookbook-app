import { getProfilesByName } from '@/server/queries'
import { ProfilesResults } from '@/components/profiles'

export const ProfilesFeed = async ({ searchParam }: { searchParam?: string }) => {
	const data = await getProfilesByName(searchParam || '')

	const profiles = Array.isArray(data) ? [] : (data?.profiles ?? [])

	return (
		<div className='w-full flex flex-col items-center'>
			<ProfilesResults
				profiles={profiles}
				searchParam={searchParam}
			/>
		</div>
	)
}
