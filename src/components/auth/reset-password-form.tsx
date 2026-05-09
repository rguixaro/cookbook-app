'use client'

import type { ComponentPropsWithoutRef } from 'react'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { KeyRound, Loader } from 'lucide-react'

import { resetPassword } from '@/server/actions/auth'
import { Button, Input } from '@/ui'

type SubmitHandler = NonNullable<ComponentPropsWithoutRef<'form'>['onSubmit']>
type ResetState =
	| 'idle'
	| 'success'
	| 'invalid'
	| 'expired'
	| 'passwords-do-not-match'
	| 'password-too-short'
	| 'password-too-long'
	| 'error'

export function ResetPasswordForm({ token }: { token: string | null }) {
	const t = useTranslations('PasswordResetPage')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [state, setState] = useState<ResetState>(token ? 'idle' : 'invalid')
	const [loading, setLoading] = useState(false)
	const submittingRef = useRef(false)

	const handleSubmit: SubmitHandler = async (event) => {
		event.preventDefault()
		if (!token || submittingRef.current) return

		submittingRef.current = true
		setLoading(true)
		setState('idle')

		try {
			const result = await resetPassword({
				token,
				password,
				confirmPassword,
			})
			setState(result.status)
		} catch {
			setState('error')
		} finally {
			submittingRef.current = false
			setLoading(false)
		}
	}

	if (state === 'success') {
		return (
			<div className='grid gap-4 text-center text-forest-300'>
				<h1 className='text-3xl font-extrabold leading-7 text-forest-300'>
					{t('reset-success-title')}
				</h1>
				<p className='mt-1 text-sm font-semibold leading-6 text-forest-300'>
					{t('reset-success-description')}
				</p>
				<Button asChild className='h-11 rounded-xl font-extrabold'>
					<Link href='/auth'>{t('back-to-login')}</Link>
				</Button>
			</div>
		)
	}

	if (!token) {
		return (
			<div className='grid gap-4 text-center text-forest-300'>
				<h1 className='text-3xl font-extrabold leading-7 text-forest-300'>
					{t('invalid-token-title')}
				</h1>
				<p className='mt-1 text-sm font-semibold leading-6 text-forest-300'>
					{t('invalid-token-description')}
				</p>
				<Button asChild className='h-11 rounded-xl font-extrabold'>
					<Link href='/auth/forgot-password'>{t('request-new-link')}</Link>
				</Button>
			</div>
		)
	}

	return (
		<form className='grid gap-4' onSubmit={handleSubmit}>
			<div className='text-center text-forest-300'>
				<h1 className='text-3xl font-extrabold leading-7 text-forest-300'>
					{t('reset-title')}
				</h1>
				<p className='mt-4 text-sm font-semibold leading-6 text-forest-300'>
					{t('reset-description')}
				</p>
			</div>
			<div className='grid gap-2'>
				<label className='sr-only' htmlFor='new-password'>
					{t('password')}
				</label>
				<Input
					id='new-password'
					autoComplete='new-password'
					className='h-11 rounded-xl border-0 bg-forest-50 text-forest-300 placeholder:text-forest-200'
					minLength={8}
					name='password'
					onChange={(event) => setPassword(event.target.value)}
					placeholder={t('password')}
					required
					type='password'
					value={password}
				/>
				<label className='sr-only' htmlFor='confirm-new-password'>
					{t('confirm-password')}
				</label>
				<Input
					id='confirm-new-password'
					autoComplete='new-password'
					className='h-11 rounded-xl border-0 bg-forest-50 text-forest-300 placeholder:text-forest-200'
					minLength={8}
					name='confirmPassword'
					onChange={(event) => setConfirmPassword(event.target.value)}
					placeholder={t('confirm-password')}
					required
					type='password'
					value={confirmPassword}
				/>
				<ResetErrorMessage state={state} />
			</div>
			<Button
				className='h-11 w-full rounded-xl text-sm font-extrabold'
				disabled={loading}
				type='submit'>
				{loading ? (
					<Loader className='animate-spin' size={18} />
				) : (
					<>
						<KeyRound size={18} />
						<span>{t('reset-submit')}</span>
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

function ResetErrorMessage({ state }: { state: ResetState }) {
	const t = useTranslations('PasswordResetPage')

	const message =
		state === 'invalid'
			? t('reset-invalid')
			: state === 'expired'
				? t('reset-expired')
				: state === 'passwords-do-not-match'
					? t('password-mismatch')
					: state === 'password-too-short'
						? t('password-too-short')
						: state === 'password-too-long'
							? t('password-too-long')
							: state === 'error'
								? t('request-error')
								: null

	return message ? (
		<p className='text-xs font-bold text-forest-300'>{message}</p>
	) : null
}
