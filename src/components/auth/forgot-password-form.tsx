'use client'

import type { ComponentPropsWithoutRef } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Loader, Mail } from 'lucide-react'

import { requestPasswordReset } from '@/server/actions/auth'
import { Button, Input } from '@/ui'

type SubmitHandler = NonNullable<ComponentPropsWithoutRef<'form'>['onSubmit']>
type RequestState = 'idle' | 'success' | 'invalid' | 'error'

export function ForgotPasswordForm() {
	const t = useTranslations('PasswordResetPage')
	const [email, setEmail] = useState('')
	const [state, setState] = useState<RequestState>('idle')
	const [loading, setLoading] = useState(false)

	const handleSubmit: SubmitHandler = async (event) => {
		event.preventDefault()
		setLoading(true)
		setState('idle')

		try {
			const result = await requestPasswordReset({ email })
			setState(result.status)
		} catch {
			setState('error')
		} finally {
			setLoading(false)
		}
	}

	if (state === 'success') {
		return (
			<div className='grid gap-4 text-center text-forest-300'>
				<h1 className='text-3xl font-extrabold leading-7 text-forest-300'>
					{t('request-success-title')}
				</h1>
				<p className='mt-1 text-sm font-semibold leading-6 text-forest-300'>
					{t('request-success-description')}
				</p>
				<Button asChild className='h-11 rounded-xl font-extrabold'>
					<Link href='/auth'>{t('back-to-login')}</Link>
				</Button>
			</div>
		)
	}

	return (
		<form className='grid gap-4' onSubmit={handleSubmit}>
			<div className='text-center text-forest-300'>
				<h1 className='text-3xl font-extrabold leading-7 text-forest-300'>
					{t('request-title')}
				</h1>
				<p className='mt-4 text-sm font-semibold leading-6 text-forest-300'>
					{t('request-description')}
				</p>
			</div>
			<div className='grid gap-2'>
				<label className='sr-only' htmlFor='password-reset-email'>
					{t('email')}
				</label>
				<Input
					id='password-reset-email'
					autoComplete='email'
					className='h-11 rounded-xl border-0 bg-forest-50 text-forest-300 placeholder:text-forest-200'
					inputMode='email'
					name='email'
					onChange={(event) => setEmail(event.target.value)}
					placeholder={t('email')}
					required
					type='email'
					value={email}
				/>
				{state === 'invalid' ? (
					<p className='text-xs font-bold text-forest-300'>
						{t('email-invalid')}
					</p>
				) : null}
				{state === 'error' ? (
					<p className='text-xs font-bold text-forest-300'>
						{t('request-error')}
					</p>
				) : null}
			</div>
			<Button
				className='h-11 w-full rounded-xl text-sm font-extrabold'
				disabled={loading}
				type='submit'>
				{loading ? (
					<Loader className='animate-spin' size={18} />
				) : (
					<>
						<Mail size={18} />
						<span>{t('request-submit')}</span>
					</>
				)}
			</Button>
			<Link
				className='mt-2 text-center text-xs font-extrabold text-forest-300 underline-offset-4 hover:underline'
				href='/auth'>
				{t('back-to-login')}
			</Link>
		</form>
	)
}
