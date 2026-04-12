'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { useTranslations } from 'next-intl'

import { Button } from '@/ui'

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		Sentry.captureException(error)
	}, [error])

	const t = useTranslations('ErrorPage')

	return (
		<div className='flex flex-col items-center justify-center min-h-[50vh] text-forest-400 text-center'>
			<h2 className='text-xl font-bold mb-4'>{t('title')}</h2>
			<p className='text-sm text-forest-300 mb-6'>{t('description')}</p>
			<Button onClick={reset}>{t('retry')}</Button>
		</div>
	)
}
