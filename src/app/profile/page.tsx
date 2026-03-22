import { auth } from '@/auth'
import { GoBack } from '@/components/layout'
import { UpdateAccount } from '@/components/profile'

export default async function ProfilePage() {
	const session = await auth()
	if (!session) return null
	return (
		<div className='flex flex-col items-center mt-5 w-full duration-500 animate-in fade-in-5 slide-in-from-bottom-2'>
			<div className='w-11/12 sm:w-3/5 lg:w-3/8'>
				<GoBack />
			</div>
			<div className='w-10/12 sm:w-2/4 lg:w-2/6'>
				<UpdateAccount
					id={session.user.id!}
					name={session.user.name!}
					email={session.user.email!}
					isPrivate={session.user.isPrivate!}
				/>
			</div>
		</div>
	)
}
