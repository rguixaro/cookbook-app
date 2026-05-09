'use client'

import { useState } from 'react'
import { AlertTriangleIcon, LoaderIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { requestEmailVerification } from '@/server/actions/auth'
import { Button } from '@/ui'

export const AccountVerificationBanner = () => {
	const t = useTranslations('ProfilePage')
	const [status, setStatus] = useState<
		'idle' | 'loading' | 'sent' | 'already-verified' | 'error'
	>('idle')

	const handleRequestVerification = async () => {
		setStatus('loading')
		try {
			const result = await requestEmailVerification()
			setStatus(result.status)
		} catch {
			setStatus('error')
		}
	}

	return (
		<div
			role='alert'
			className='my-5 flex w-full items-start gap-3 rounded-3xl border-8 border-forest-150 bg-forest-100 p-4 text-forest-300'>
			<AlertTriangleIcon
				size={22}
				className='mt-0.5 shrink-0'
				aria-hidden='true'
			/>
			<div className='space-y-1'>
				<p className='font-bold'>{t('account-unverified-title')}</p>
				<p className='text-sm leading-5'>
					{t('account-unverified-description')}
				</p>
				<Button
					className='mt-3 h-9 rounded-xl  px-3 text-xs font-extrabold text-forest-50'
					disabled={status === 'loading' || status === 'sent'}
					onClick={handleRequestVerification}
					aria-label={
						status === 'loading'
							? t('account-verification-sending')
							: undefined
					}
					type='button'>
					{status === 'loading' ? (
						<LoaderIcon size={16} className='animate-spin' aria-hidden='true' />
					) : (
						t(
							status === 'sent'
								? 'account-verification-sent'
								: 'account-verification-send',
						)
					)}
				</Button>
				{status === 'error' ? (
					<p className='text-xs font-bold mt-3'>
						{t('account-verification-error')}
					</p>
				) : null}
				{status === 'already-verified' ? (
					<p className='text-xs font-bold mt-3'>
						{t('account-verification-already-verified')}
					</p>
				) : null}
			</div>
		</div>
	)
}
