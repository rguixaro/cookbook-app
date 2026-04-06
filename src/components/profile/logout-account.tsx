'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { handleSignOut } from '@/server/actions'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Button,
	DialogFooter,
} from '@/ui'
import { DialogClose } from '@radix-ui/react-dialog'
import { LoaderIcon } from 'lucide-react'

interface LogoutAccountProps {
	trigger: ReactNode
}

export const LogoutAccount = (props: LogoutAccountProps) => {
	const t = useTranslations('ProfilePage')

	const [loading, setLoading] = useState<boolean>(false)

	async function handleLogoutAccount() {
		setLoading(true)
		try {
			await handleSignOut()
		} catch (error) {
			if (isRedirectError(error)) throw error
			toast.error(t('account-logout-error'))
			setLoading(false)
		}
	}

	return (
		<Dialog>
			<DialogTrigger asChild>{props.trigger}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('account-logout') + '?'}</DialogTitle>
					<DialogDescription>{t('account-logout-text')}</DialogDescription>
				</DialogHeader>
				<DialogFooter className='mt-3'>
					<DialogClose asChild>
						<Button
							variant='ghost'
							disabled={loading}
							className='font-bold text-forest-400 md:mt-0'>
							{t('cancel')}
						</Button>
					</DialogClose>
					<Button disabled={loading} onClick={handleLogoutAccount}>
						{loading && (
							<LoaderIcon size={16} className='animate-spin' />
						)}
						<span className='font-bold'>{t('account-logout')}</span>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
