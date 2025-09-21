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
	id: string
	name: string
	email: string
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
			email: props.email,
		},
	})

	const onSubmit = async (values: z.infer<typeof UpdateProfileSchema>) => {
		try {
			setLoading(true)
			await updateProfile(values)
			toast.success('Profile updated successfully.')
		} catch (error) {
			toast.error('An unexpected error has occurred. Please try again later.')
		} finally {
			setLoading(false)
		}
	}

	const handleCopy = (text: string) => () => {
		copy(text)
			.then(() => {
				toast.success(t_toasts('account-link-copied'))
			})
			.catch((error) => {
				toast.error(
					'An unexpected error has occurred. Please try again later.',
					{ description: error }
				)
			})
	}

	const ShareComponent = () => {
		return (
			<button
				onClick={handleCopy(`${SITE_URL}/authors/${props.id}`)}
				className='bg-forest-200 text-white font-bold rounded text-xs md:text-sm px-2 py-1 transition-colors duration-300 hover:bg-forest-200/75 shadow'>
				<span>{t('share')}</span>
			</button>
		)
	}

	return (
		<ProfileCard
			title={t('title')}
			description={t('description')}
			action={<ShareComponent />}>
			<Form {...hookForm}>
				<form
					onSubmit={hookForm.handleSubmit(onSubmit)}
					className='space-y-5 mb-5 text-forest-400'>
					<FormField
						control={hookForm.control}
						name='name'
						render={({ field }) => (
							<FormItem>
								<FormLabel className='font-semibold'>
									{t('name')}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t('name')}
										disabled={loading}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={hookForm.control}
						name='email'
						render={({ field }) => (
							<FormItem>
								<FormLabel className='font-semibold'>
									{t('email')}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t('email')}
										{...field}
										disabled
									/>
								</FormControl>
								<FormDescription className='flex items-center gap-2 pl-1 text-forest-400'>
									<AlertTriangleIcon size={24} />
									<span>{t('email-hint')}</span>
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<DeleteAccount
						email={props.email!}
						trigger={
							<Button
								variant='destructive'
								size='sm'
								className='w-1/2'>
								<span className='font-bold'>
									{t('account-delete')}
								</span>
							</Button>
						}
					/>
					<div className='flex items-center'>
						<Button
							type='submit'
							className='w-full'
							disabled={
								loading || hookForm.getValues().name === props.name
							}>
							{loading ? (
								<LoaderIcon size={16} className='animate-spin' />
							) : (
								<SaveIcon size={16} />
							)}
							<span>{loading ? t('saving') : t('save')}</span>
						</Button>
					</div>
				</form>
			</Form>
			<LogoutAccount
				trigger={
					<Button variant='outline' className='mt-20'>
						<LogOut size={16} color='#3D6C5F' />
						<span className='font-semibold text-forest-400'>
							{t('account-logout')}
						</span>
					</Button>
				}
			/>
		</ProfileCard>
	)
}
