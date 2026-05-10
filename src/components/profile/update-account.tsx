'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { KeyRoundIcon, LoaderIcon, MailCheckIcon } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import type { z } from 'zod'

import { changePassword, requestEmailChange, updateProfile } from '@/server/actions'
import {
	ChangePasswordSchema,
	RequestEmailChangeSchema,
	UpdateProfileSchema,
} from '@/server/schemas'
import { useCopyToClipboard } from '@/hooks'
import {
	Button,
	Input,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/ui'
import { SITE_URL } from '@/utils'
import { ProfileCard } from './card'
import { DeleteAccount } from './delete-account'
import { LogoutAccount } from './logout-account'

interface UpdateAccountProps {
	username: string
	name: string
	email: string
	isPrivate: boolean
	isCredentialsAccount: boolean
}

type LoadingState = 'profile' | 'email' | 'password' | null

const emailChangeErrorKey = {
	invalid: 'credentials-invalid',
	forbidden: 'credentials-provider-managed',
	'incorrect-password': 'current-password-incorrect',
	'email-in-use': 'email-in-use',
	'rate-limited': 'rate-limited',
	error: 'credential-update-error',
} as const

const passwordChangeErrorKey = {
	invalid: 'credentials-invalid',
	forbidden: 'credentials-provider-managed',
	'incorrect-password': 'current-password-incorrect',
	'password-too-short': 'password-too-short',
	'password-too-long': 'password-too-long',
	'passwords-do-not-match': 'passwords-do-not-match',
	error: 'credential-update-error',
} as const

export const UpdateAccount = (props: UpdateAccountProps) => {
	const t = useTranslations('ProfilePage')
	const t_toasts = useTranslations('toasts')
	const t_legal = useTranslations('LoginPage')

	const { copy } = useCopyToClipboard()

	const [loading, setLoading] = useState<LoadingState>(null)

	const profileForm = useForm<z.infer<typeof UpdateProfileSchema>>({
		resolver: zodResolver(UpdateProfileSchema),
		defaultValues: {
			name: props.name,
			isPrivate: props.isPrivate,
		},
	})

	const emailForm = useForm<z.infer<typeof RequestEmailChangeSchema>>({
		resolver: zodResolver(RequestEmailChangeSchema),
		defaultValues: {
			email: props.email,
			currentPassword: '',
		},
	})

	const passwordForm = useForm<z.infer<typeof ChangePasswordSchema>>({
		resolver: zodResolver(ChangePasswordSchema),
		defaultValues: {
			currentPassword: '',
			password: '',
			confirmPassword: '',
		},
	})

	const watchedName = profileForm.watch('name')
	const watchedIsPrivate = profileForm.watch('isPrivate')
	const watchedEmail = emailForm.watch('email')
	const watchedEmailCurrentPassword = emailForm.watch('currentPassword')
	const watchedPasswordCurrentPassword = passwordForm.watch('currentPassword')
	const watchedPassword = passwordForm.watch('password')
	const watchedConfirmPassword = passwordForm.watch('confirmPassword')

	const handleProfileSubmit = async (
		values: z.infer<typeof UpdateProfileSchema>,
	) => {
		try {
			setLoading('profile')
			await updateProfile(values)
			toast.success(t_toasts('profile-updated'))
		} catch {
			toast.error(t_toasts('error'))
		} finally {
			setLoading(null)
		}
	}

	const handleEmailChangeSubmit = async (
		values: z.infer<typeof RequestEmailChangeSchema>,
	) => {
		try {
			setLoading('email')
			const result = await requestEmailChange(values)
			if (result.status !== 'sent') {
				toast.error(t(emailChangeErrorKey[result.status]))
				return
			}

			toast.success(t('email-change-sent'))
			emailForm.reset({ email: values.email, currentPassword: '' })
		} catch {
			toast.error(t('credential-update-error'))
		} finally {
			setLoading(null)
		}
	}

	const handlePasswordSubmit = async (
		values: z.infer<typeof ChangePasswordSchema>,
	) => {
		try {
			setLoading('password')
			const result = await changePassword(values)
			if (result.status !== 'success') {
				toast.error(t(passwordChangeErrorKey[result.status]))
				return
			}

			toast.success(t('password-changed'))
			passwordForm.reset()
			await signOut({ callbackUrl: '/auth' })
		} catch {
			toast.error(t('credential-update-error'))
			setLoading(null)
		}
	}

	const handleCopy = (text: string) => () => {
		copy(text)
			.then(() => toast.success(t_toasts('account-link-copied')))
			.catch(() => toast.error(t_toasts('error')))
	}

	const normalizedWatchedEmail = watchedEmail.trim().toLowerCase()
	const normalizedCurrentEmail = props.email.trim().toLowerCase()
	const profileUnchanged =
		watchedName === props.name && watchedIsPrivate === props.isPrivate
	const emailSubmitDisabled =
		loading !== null ||
		normalizedWatchedEmail === normalizedCurrentEmail ||
		!watchedEmailCurrentPassword
	const passwordSubmitDisabled =
		loading !== null ||
		!watchedPasswordCurrentPassword ||
		!watchedPassword ||
		!watchedConfirmPassword

	return (
		<ProfileCard
			title={t('title')}
			description={t('description')}
			action={
				<LogoutAccount
					trigger={
						<Button
							size='sm'
							className='w-fit self-center text-forest-50'>
							<span className='font-bold'>{t('account-logout')}</span>
						</Button>
					}
				/>
			}>
			<div className='space-y-6 text-forest-300'>
				<Form {...profileForm}>
					<form
						onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
						className='space-y-5'>
						<FormField
							control={profileForm.control}
							name='isPrivate'
							render={({ field }) => (
								<FormItem className='space-y-1'>
									<FormLabel className='font-bold'>
										{t('private')}
									</FormLabel>
									<FormDescription className='text-sm mb-2'>
										{t('private-description')}
									</FormDescription>
									<FormControl className='space-y-2'>
										<label className='relative inline-flex items-start cursor-pointer justify-between w-full'>
											<input
												type='checkbox'
												className='sr-only'
												disabled={loading !== null}
												checked={!!field.value}
												onChange={(e) =>
													field.onChange(e.target.checked)
												}
											/>
											<span
												className={`w-11 h-6 rounded-full transition-colors ${
													field.value
														? 'bg-forest-300'
														: 'bg-forest-150'
												}`}
											/>
											<span
												className={`absolute left-0.5 top-0.5 w-5 h-5 bg-forest-50 rounded-full shadow-center-md transform transition-transform ${
													field.value
														? 'translate-x-5'
														: 'translate-x-0'
												}`}
											/>
											{!field.value && (
												<Button
													type='button'
													size='sm'
													disabled={loading !== null}
													onClick={handleCopy(
														`${SITE_URL}/profiles/${props.username}`,
													)}>
													<span className='font-bold text-forest-50'>
														{t('share')}
													</span>
												</Button>
											)}
										</label>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={profileForm.control}
							name='name'
							render={({ field }) => (
								<FormItem>
									<FormLabel className='font-bold'>
										{t('name')}
									</FormLabel>
									<FormControl>
										<Input
											placeholder={t('name')}
											disabled={loading !== null}
											className='rounded-2xl py-5 bg-forest-50 border-2 my-2'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className='flex items-center'>
							<Button
								type='submit'
								className='w-full rounded-xl'
								disabled={loading !== null || profileUnchanged}>
								{loading === 'profile' ? (
									<LoaderIcon size={16} className='animate-spin' />
								) : (
									<span className='font-bold'>{t('save')}</span>
								)}
							</Button>
						</div>
					</form>
				</Form>
				{props.isCredentialsAccount ? (
					<div className='space-y-5 border-t-2 border-forest-150 pt-5'>
						<Form {...emailForm}>
							<form
								onSubmit={emailForm.handleSubmit(
									handleEmailChangeSubmit,
								)}
								className='space-y-3'>
								<div>
									<p className='font-bold'>{t('email')}</p>
									<p className='text-sm font-semibold text-forest-200'>
										{t('email-change-hint')}
									</p>
								</div>
								<FormField
									control={emailForm.control}
									name='email'
									render={({ field }) => (
										<FormItem>
											<FormLabel className='sr-only'>
												{t('email')}
											</FormLabel>
											<FormControl>
												<Input
													type='email'
													inputMode='email'
													autoComplete='email'
													placeholder={t('email')}
													disabled={loading !== null}
													className='rounded-2xl py-5 bg-forest-50 border-2 my-2'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={emailForm.control}
									name='currentPassword'
									render={({ field }) => (
										<FormItem>
											<FormLabel className='sr-only'>
												{t('current-password')}
											</FormLabel>
											<FormControl>
												<Input
													type='password'
													autoComplete='current-password'
													placeholder={t(
														'current-password',
													)}
													disabled={loading !== null}
													className='rounded-2xl py-5 bg-forest-50 border-2 my-2'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Button
									type='submit'
									className='w-full rounded-xl'
									disabled={emailSubmitDisabled}>
									{loading === 'email' ? (
										<LoaderIcon
											size={16}
											className='animate-spin'
										/>
									) : (
										<>
											<MailCheckIcon size={16} />
											<span className='font-bold'>
												{t('send-email-change')}
											</span>
										</>
									)}
								</Button>
							</form>
						</Form>

						<Form {...passwordForm}>
							<form
								onSubmit={passwordForm.handleSubmit(
									handlePasswordSubmit,
								)}
								className='space-y-3'>
								<div>
									<p className='font-bold'>{t('password')}</p>
									<p className='text-sm font-semibold text-forest-200'>
										{t('password-change-hint')}
									</p>
								</div>
								<FormField
									control={passwordForm.control}
									name='currentPassword'
									render={({ field }) => (
										<FormItem>
											<FormLabel className='sr-only'>
												{t('current-password')}
											</FormLabel>
											<FormControl>
												<Input
													type='password'
													autoComplete='current-password'
													placeholder={t(
														'current-password',
													)}
													disabled={loading !== null}
													className='rounded-2xl py-5 bg-forest-50 border-2 my-2'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={passwordForm.control}
									name='password'
									render={({ field }) => (
										<FormItem>
											<FormLabel className='sr-only'>
												{t('new-password')}
											</FormLabel>
											<FormControl>
												<Input
													type='password'
													autoComplete='new-password'
													minLength={8}
													placeholder={t('new-password')}
													disabled={loading !== null}
													className='rounded-2xl py-5 bg-forest-50 border-2 my-2'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={passwordForm.control}
									name='confirmPassword'
									render={({ field }) => (
										<FormItem>
											<FormLabel className='sr-only'>
												{t('confirm-password')}
											</FormLabel>
											<FormControl>
												<Input
													type='password'
													autoComplete='new-password'
													minLength={8}
													placeholder={t(
														'confirm-password',
													)}
													disabled={loading !== null}
													className='rounded-2xl py-5 bg-forest-50 border-2 my-2'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Button
									type='submit'
									className='w-full rounded-xl'
									disabled={passwordSubmitDisabled}>
									{loading === 'password' ? (
										<LoaderIcon
											size={16}
											className='animate-spin'
										/>
									) : (
										<>
											<KeyRoundIcon size={16} />
											<span className='font-bold'>
												{t('change-password')}
											</span>
										</>
									)}
								</Button>
							</form>
						</Form>
					</div>
				) : (
					<div className='border-t-2 border-forest-150 pt-5'>
						<label className='font-bold' htmlFor='profile-email'>
							{t('email')}
						</label>
						<p className='flex items-center space-x-2 my-2 text-sm text-forest-300'>
							<span>{t('email-provider-managed-hint')}</span>
						</p>
						<Input
							id='profile-email'
							placeholder={t('email')}
							value={props.email}
							className='rounded-2xl py-5 bg-forest-50 border-2 my-2'
							disabled
							readOnly
						/>
					</div>
				)}

				<DeleteAccount
					email={props.email}
					trigger={
						<Button variant='ghost' size='sm' className='w-fit'>
							<span className='font-bold'>{t('account-delete')}</span>
						</Button>
					}
				/>
				<div className='flex items-center justify-center space-x-2 text-center text-xs font-semibold leading-5 text-forest-200'>
					<Link
						className='text-forest-300 underline underline-offset-4'
						href='/terms?from=profile'>
						{t_legal('terms')}
					</Link>
					<div className='bg-forest-200/40 h-0.5 w-1 rounded-2xl' />
					<Link
						className='text-forest-300 underline underline-offset-4'
						href='/privacy?from=profile'>
						{t_legal('privacy')}
					</Link>
				</div>
			</div>
		</ProfileCard>
	)
}
