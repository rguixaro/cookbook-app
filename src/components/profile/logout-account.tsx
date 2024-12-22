'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { handleSignOut } from '@/server/actions';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Button,
	DialogFooter,
} from '@/ui';
import { DialogClose } from '@radix-ui/react-dialog';
import { LoaderIcon } from 'lucide-react';

interface LogoutAccountProps {
	trigger: ReactNode;
}

export const LogoutAccount = (props: LogoutAccountProps) => {
	const t = useTranslations('ProfilePage');

	const [loading, setLoading] = useState<boolean>(false);

	async function handleLogoutAccount() {
		setLoading(true);
		toast.promise(handleSignOut, {
			loading: t('account-logout-logging-out'),
			error: t('account-logout-logged-out'),
		});
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
							className='font-bold'>
							{t('cancel')}
						</Button>
					</DialogClose>
					<Button
						disabled={loading}
						onClick={handleLogoutAccount}
						variant='destructive'>
						{loading ?? (
							<LoaderIcon size={16} className='animate-spin' />
						)}
						<span>{t('account-logout')}</span>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
