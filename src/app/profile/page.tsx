import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export const metadata: Metadata = {
	title: 'My Profile - CookBook',
}
import { GoBack } from '@/components/layout'
import { ExportAccount, UpdateAccount } from '@/components/profile'
import { db } from '@/server/db'

export default async function ProfilePage() {
	const session = await auth()
	if (!session) redirect('/auth')

	const user = await db.user.findUnique({
		where: { id: session.user.id },
		select: { username: true },
	})
	if (!user) return null

	return (
		<div className='flex flex-col items-center mt-5 w-full duration-500 animate-in fade-in-5 slide-in-from-bottom-2'>
			<div className='w-11/12 sm:w-3/5 lg:w-3/8'>
				<GoBack />
			</div>
			<div className='w-10/12 sm:w-2/4 lg:w-2/6'>
				<UpdateAccount
					username={user.username}
					name={session.user.name ?? ''}
					email={session.user.email!}
					isPrivate={session.user.isPrivate!}
				/>
				<ExportAccount />
			</div>
		</div>
	)
}
