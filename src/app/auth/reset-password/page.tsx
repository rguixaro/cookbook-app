import type { Metadata } from 'next'

import { ResetPasswordForm } from '@/components/auth'

export const metadata: Metadata = {
	title: 'Reset Password - CookBook',
	description: 'Choose a new CookBook password',
}

export default async function ResetPasswordPage({
	searchParams,
}: {
	searchParams?: Promise<{ token?: string }>
}) {
	const token = (await searchParams)?.token ?? null

	return (
		<div className='w-full max-w-sm overflow-hidden rounded-[20px] border-8 border-forest-150 bg-forest-150 p-4 shadow-center-sm'>
			<ResetPasswordForm token={token} />
		</div>
	)
}
