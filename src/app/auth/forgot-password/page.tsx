import type { Metadata } from 'next'

import { ForgotPasswordForm } from '@/components/auth'

export const metadata: Metadata = {
	title: 'Forgot Password - CookBook',
	description: 'Request a CookBook password reset link',
}

export default function ForgotPasswordPage() {
	return (
		<div className='w-full max-w-sm overflow-hidden rounded-[20px] border-8 border-forest-150 bg-forest-150 p-4 shadow-center-sm'>
			<ForgotPasswordForm />
		</div>
	)
}
