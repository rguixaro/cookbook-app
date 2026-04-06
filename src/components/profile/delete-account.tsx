'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { LoaderIcon } from 'lucide-react'
import { toast } from 'sonner'

import { deleteProfile } from '@/server/actions'
import {
	Input,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Button,
} from '@/ui'

interface DeleteAccountProps {
	trigger: ReactNode
	email: string
}

export const DeleteAccount = (props: DeleteAccountProps) => {
	const t = useTranslations('ProfilePage')

	const [confirmEmail, setConfirmEmail] = useState<string>('')
	const [loading, setLoading] = useState<boolean>(false)

	const handleDeleteAccount = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (confirmEmail !== props.email) {
			toast.error(t('email-unmatched'))
			return
		}
		setLoading(true)
		try {
			const result = await deleteProfile()
			if (!result) throw new Error()
			toast.success(t('account-deleted'))
		} catch (error) {
			if (isRedirectError(error)) throw error
			toast.error(t('account-delete-error'))
			setLoading(false)
		}
	}

	return (
		<Dialog>
			<DialogTrigger asChild>{props.trigger}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('account-delete')}</DialogTitle>
					<DialogDescription className='flex flex-col space-y-2'>
						<span className='text-red-500 font-semibold'>
							{t('account-delete-attention')}
						</span>{' '}
						<span>{t('account-delete-text')}</span>
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleDeleteAccount}>
					<div className='flex flex-col space-y-3 text-forest-400'>
						<p className='text-sm'>
							{t('account-delete-prompt')}{' '}
							<span className='font-semibold'>{props.email}</span>
						</p>
						<Input
							type='email'
							className='input'
							onChange={(e) => setConfirmEmail(e.target.value)}
							placeholder={t('email')}
							disabled={loading}
						/>
						<DialogFooter className='mt-3'>
							<DialogClose asChild>
								<Button
									variant='ghost'
									disabled={loading}
									className='font-bold text-forest-400'>
									{t('cancel')}
								</Button>
							</DialogClose>
							<Button
								disabled={loading || confirmEmail !== props.email}
								type='submit'
								variant='destructive'>
								{loading && (
									<LoaderIcon size={16} className='animate-spin' />
								)}
								<span className='font-bold'>
									{loading ? t('deleting') : t('delete')}
								</span>
							</Button>
						</DialogFooter>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
