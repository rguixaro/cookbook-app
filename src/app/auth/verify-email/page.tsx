import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { CheckCircle2, CircleAlert, Clock } from 'lucide-react'

import { verifyEmail } from '@/server/actions/auth'
import { Button } from '@/ui'

export const metadata: Metadata = {
	title: 'Verify Email - CookBook',
	description: 'Verify your CookBook email address',
}

export default async function VerifyEmailPage({
	searchParams,
}: {
	searchParams?: Promise<{ token?: string }>
}) {
	const t = await getTranslations('EmailVerificationPage')
	const token = (await searchParams)?.token ?? ''
	const result = await verifyEmail(token)
	const Icon =
		result.status === 'success'
			? CheckCircle2
			: result.status === 'expired'
				? Clock
				: CircleAlert

	return (
		<div className='w-full max-w-sm overflow-hidden rounded-[20px] border-8 border-forest-150 bg-forest-150 p-4 shadow-center-sm'>
			<div className='grid gap-4 text-center text-forest-300'>
				<Icon className='mx-auto text-forest-300' size={36} />
				<h1 className='text-3xl font-extrabold leading-7 text-forest-300'>
					{t(`${result.status}-title`)}
				</h1>
				<p className='mt-1 text-sm font-semibold leading-6 text-forest-300'>
					{t(`${result.status}-description`)}
				</p>
				<Button asChild className='h-11 rounded-xl font-extrabold'>
					<Link href={result.status === 'success' ? '/profile' : '/auth'}>
						{t(
							result.status === 'success'
								? 'go-to-profile'
								: 'go-to-login',
						)}
					</Link>
				</Button>
			</div>
		</div>
	)
}
