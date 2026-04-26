'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { AlertTriangleIcon, LoaderIcon, LogOut, SaveIcon } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import type { z } from 'zod'

import { updateProfile } from '@/server/actions'
import { UpdateProfileSchema } from '@/server/schemas'
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
}

export const UpdateAccount = (props: UpdateAccountProps) => {
	const t = useTranslations('ProfilePage')
	const t_toasts = useTranslations('toasts')

	const { copy } = useCopyToClipboard()

	const [loading, setLoading] = useState<boolean>(false)

	const hookForm = useForm<z.infer<typeof UpdateProfileSchema>>({
		resolver: zodResolver(UpdateProfileSchema),
		defaultValues: {
			name: props.name,
			isPrivate: props.isPrivate,
		},
	})

	const watchedName = hookForm.watch('name')
	const watchedIsPrivate = hookForm.watch('isPrivate')

	const onSubmit = async (values: z.infer<typeof UpdateProfileSchema>) => {
		try {
			setLoading(true)
			await updateProfile(values)
			toast.success(t_toasts('profile-updated'))
		} catch {
			toast.error(t_toasts('error'))
		} finally {
			setLoading(false)
		}
	}

	const handleCopy = (text: string) => () => {
		copy(text)
			.then(() => toast.success(t_toasts('account-link-copied')))
			.catch(() => toast.error(t_toasts('error')))
	}

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
			<Form {...hookForm}>
				<form
					onSubmit={hookForm.handleSubmit(onSubmit)}
					className='space-y-5 text-forest-400'>
					<FormField
						control={hookForm.control}
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
											disabled={loading}
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
						control={hookForm.control}
						name='name'
						render={({ field }) => (
							<FormItem>
								<FormLabel className='font-bold'>
									{t('name')}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t('name')}
										disabled={loading}
										className='rounded-2xl py-5 bg-forest-50 border-2 my-2'
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormItem>
						<FormLabel className='font-bold'>{t('email')}</FormLabel>
						<FormDescription className='flex items-center space-x-2 my-2 text-forest-400'>
							<AlertTriangleIcon size={18} />
							<span>{t('email-hint')}</span>
						</FormDescription>
						<Input
							placeholder={t('email')}
							value={props.email}
							className='rounded-2xl py-5 bg-forest-50 border-2 my-2'
							disabled
						/>
					</FormItem>
					<div className='flex items-center'>
						<Button
							type='submit'
							className='w-full'
							disabled={
								loading ||
								(watchedName === props.name &&
									watchedIsPrivate === props.isPrivate)
							}>
							{loading ? (
								<LoaderIcon size={16} className='animate-spin' />
							) : (
								<span className='font-bold'>{t('save')}</span>
							)}
						</Button>
					</div>
					<div className='w-full justify-center flex my-8'>
						<div className='h-2 w-3/4 rounded bg-forest-150' />
					</div>
					<DeleteAccount
						email={props.email}
						trigger={
							<Button variant='ghost' size='sm' className='w-fit'>
								<span className='font-bold underline'>
									{t('account-delete')}
								</span>
							</Button>
						}
					/>
				</form>
			</Form>
		</ProfileCard>
	)
}
