import { auth } from '@/auth';
import { GoBack } from '@/components/layout/go-back';
import { UpdateAccount } from '@/components/profile';

export default async function ProfilePage() {
	const session = await auth();
	if (!session) return null;

	return (
		<div className='mt-5 duration-500 animate-in fade-in-5 slide-in-from-bottom-2'>
			<GoBack />
			<UpdateAccount
				name={session.user.name!}
				username={session.user.username!}
				email={session.user.email!}
			/>
		</div>
	);
}
