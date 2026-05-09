'use client'

import type { ComponentPropsWithoutRef } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader, LogIn, Mail, UserPlus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'

import { DEFAULT_AUTH_REDIRECT_URL } from '@/routes'
import { GoogleLogo } from '@/components/icons'
import { signUpWithCredentials } from '@/server/actions/auth'
import { Button, Input } from '@/ui'

type CredentialsMode = 'choice' | 'sign-in' | 'sign-up'
type LoadingState = 'credentials' | 'google' | null
type FormSubmitHandler = NonNullable<ComponentPropsWithoutRef<'form'>['onSubmit']>

const signUpErrorKey = {
	invalid: 'credentials-invalid',
	'passwords-do-not-match': 'credentials-password-mismatch',
	'email-in-use': 'credentials-email-in-use',
	'username-taken': 'credentials-username-taken',
	error: 'credentials-error',
} as const

export const CredentialsLogin = () => {
	const t = useTranslations('LoginPage')
	const router = useRouter()
	const callbackUrl = useSafeCallbackUrl()
	const [mode, setMode] = useState<CredentialsMode>('choice')
	const [username, setUsername] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [loading, setLoading] = useState<LoadingState>(null)

	const isSignUp = mode === 'sign-up'

	const handleGoogleLogin = async () => {
		try {
			setLoading('google')
			await signIn('google', {
				callbackUrl: callbackUrl || DEFAULT_AUTH_REDIRECT_URL,
			})
		} catch {
			toast.error(t('login-error'))
		} finally {
			setLoading(null)
		}
	}

	const handleCredentialsLogin: FormSubmitHandler = async (event) => {
		event.preventDefault()
		setLoading('credentials')

		try {
			if (isSignUp) {
				if (password !== confirmPassword) {
					toast.error(t('credentials-password-mismatch'))
					return
				}

				const result = await signUpWithCredentials({
					email,
					password,
					confirmPassword,
					username,
				})

				if (result.status !== 'success') {
					toast.error(t(signUpErrorKey[result.status]))
					return
				}
			}

			const result = await signIn('credentials', {
				email,
				password,
				redirect: false,
				callbackUrl: callbackUrl || DEFAULT_AUTH_REDIRECT_URL,
			})

			if (typeof result === 'object' && result?.error) {
				toast.error(t('credentials-invalid'))
				return
			}

			const redirectUrl =
				typeof result === 'object' && result?.url
					? result.url
					: callbackUrl || DEFAULT_AUTH_REDIRECT_URL

			router.push(redirectUrl)
			router.refresh()
		} catch {
			toast.error(t('credentials-error'))
		} finally {
			setLoading(null)
		}
	}

	return (
		<AnimatePresence mode='wait' initial={false}>
			{mode === 'choice' ? (
				<motion.div
					animate={{ opacity: 1, y: 0 }}
					className='grid w-full min-w-0 gap-3 text-forest-100'
					exit={{ opacity: 0, y: -8 }}
					initial={{ opacity: 0, y: 8 }}
					key='auth-choice'
					transition={{ duration: 0.18 }}>
					<Button
						className='h-12 w-full rounded-xl p-4 text-base text-forest-100 shadow-none!'
						disabled={loading !== null}
						onClick={() => setMode('sign-in')}
						type='button'>
						<Mail size={18} />
						<span className='font-bold'>{t('email-login-option')}</span>
					</Button>
					<GoogleLoginButton
						disabled={loading !== null}
						isLoading={loading === 'google'}
						label={t('google-login')}
						onClick={handleGoogleLogin}
					/>
					<AuthLegalCopy prefixKey='continue-legal-prefix' />
					<button
						className='text-xs font-bold text-forest-300 underline-offset-4 hover:underline disabled:opacity-50'
						disabled={loading !== null}
						onClick={() => setMode('sign-up')}
						type='button'>
						{t('show-sign-up')}
					</button>
				</motion.div>
			) : (
				<motion.form
					animate={{ opacity: 1, y: 0 }}
					className='grid w-full min-w-0 gap-3 text-forest-100'
					exit={{ opacity: 0, y: 8 }}
					initial={{ opacity: 0, y: -8 }}
					key={mode}
					onSubmit={handleCredentialsLogin}
					transition={{ duration: 0.18 }}>
					<div className='grid gap-2'>
						<label className='sr-only' htmlFor='credentials-email'>
							{t('email')}
						</label>
						<Input
							id='credentials-email'
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
						{isSignUp ? (
							<>
								<label
									className='sr-only'
									htmlFor='credentials-username'>
									{t('username')}
								</label>
								<Input
									id='credentials-username'
									autoComplete='username'
									className='h-11 rounded-xl border-0 bg-forest-50 text-forest-300 placeholder:text-forest-200'
									maxLength={30}
									minLength={3}
									name='username'
									onChange={(event) =>
										setUsername(event.target.value)
									}
									pattern='[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]'
									placeholder={t('username')}
									required
									type='text'
									value={username}
								/>
							</>
						) : null}
						<label className='sr-only' htmlFor='credentials-password'>
							{t('password')}
						</label>
						<Input
							id='credentials-password'
							autoComplete={
								isSignUp ? 'new-password' : 'current-password'
							}
							className='h-11 rounded-xl border-0 bg-forest-50 text-forest-300 placeholder:text-forest-200'
							minLength={isSignUp ? 8 : 1}
							name='password'
							onChange={(event) => setPassword(event.target.value)}
							placeholder={t('password')}
							required
							type='password'
							value={password}
						/>
						{isSignUp ? (
							<>
								<label
									className='sr-only'
									htmlFor='credentials-confirm-password'>
									{t('confirm-password')}
								</label>
								<Input
									id='credentials-confirm-password'
									autoComplete='new-password'
									className='h-11 rounded-xl border-0 bg-forest-50 text-forest-300 placeholder:text-forest-200'
									minLength={8}
									name='confirmPassword'
									onChange={(event) =>
										setConfirmPassword(event.target.value)
									}
									placeholder={t('confirm-password')}
									required
									type='password'
									value={confirmPassword}
								/>
							</>
						) : null}
						{!isSignUp ? (
							<Link
								className='justify-self-end text-xs font-extrabold text-forest-300 underline-offset-4 hover:underline'
								href='/auth/forgot-password'>
								{t('forgot-password')}
							</Link>
						) : null}
					</div>
					<Button
						className='h-11 mt-4 w-full rounded-xl text-sm font-extrabold text-forest-50'
						disabled={loading !== null}
						type='submit'>
						{loading === 'credentials' ? (
							<Loader className='animate-spin' size={18} />
						) : (
							<>
								{isSignUp ? (
									<UserPlus size={18} />
								) : (
									<LogIn size={18} />
								)}
								<span>
									{t(isSignUp ? 'create-account' : 'email-login')}
								</span>
							</>
						)}
					</Button>
					<GoogleLoginButton
						disabled={loading !== null}
						isLoading={loading === 'google'}
						label={t('google-login')}
						onClick={handleGoogleLogin}
					/>
					<AuthLegalCopy
						prefixKey={
							isSignUp
								? 'signup-legal-prefix'
								: 'continue-legal-prefix'
						}
					/>
					<button
						className='text-xs font-extrabold text-forest-300 underline-offset-4 hover:underline disabled:opacity-50'
						disabled={loading !== null}
						onClick={() => setMode(isSignUp ? 'sign-in' : 'sign-up')}
						type='button'>
						{t(isSignUp ? 'show-sign-in' : 'show-sign-up')}
					</button>
				</motion.form>
			)}
		</AnimatePresence>
	)
}

function GoogleLoginButton({
	disabled,
	isLoading,
	label,
	onClick,
}: {
	disabled: boolean
	isLoading: boolean
	label: string
	onClick: () => void
}) {
	return (
		<Button
			className='h-12 w-full hover:bg-forest-50 rounded-xl p-4 text-base shadow-none!'
			disabled={disabled}
			variant='outline'
			onClick={onClick}
			type='button'>
			{isLoading ? (
				<Loader className='animate-spin' size={22} />
			) : (
				<>
					<GoogleLogo className='h-4 w-4' />
					<span className='font-semibold'>{label}</span>
				</>
			)}
		</Button>
	)
}

function AuthLegalCopy({
	prefixKey,
}: {
	prefixKey: 'continue-legal-prefix' | 'signup-legal-prefix'
}) {
	const t = useTranslations('LoginPage')

	return (
		<p className='text-center text-[0.7rem] font-semibold leading-5 text-forest-200'>
			{t(prefixKey)}{' '}
			<Link
				className='text-forest-300 underline underline-offset-4'
				href='/terms'>
				{t('terms')}
			</Link>{' '}
			{t('signup-legal-middle')}{' '}
			<Link
				className='text-forest-300 underline underline-offset-4'
				href='/privacy'>
				{t('privacy')}
			</Link>
		</p>
	)
}

function useSafeCallbackUrl() {
	const searchParams = useSearchParams()
	const rawCallbackUrl = searchParams.get('callbackUrl')

	if (
		rawCallbackUrl &&
		rawCallbackUrl.startsWith('/') &&
		rawCallbackUrl[1] !== '/' &&
		rawCallbackUrl[1] !== '\\'
	) {
		return rawCallbackUrl
	}

	return null
}
