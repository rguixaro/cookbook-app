'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { LoaderIcon } from 'lucide-react';
import { toast } from 'sonner';

import { deleteProfile } from '@/server/actions';
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
} from '@/ui';

interface DeleteAccountProps {
	trigger: ReactNode;
	email: string;
}

export const DeleteAccount = (props: DeleteAccountProps) => {
	const t = useTranslations('ProfilePage');

	const [confirmEmail, setConfirmEmail] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);

	const handleDeleteAccount = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (confirmEmail !== props.email) {
			toast.error(t('email-unmatched'));
			return;
		}
		setLoading(true);
		toast.promise(deleteProfile, {
			loading: t('deleting'),
			description: t('account-deleting'),
			success: () => {
				setLoading(false);
				return t('account-deleted');
			},
			error: t('account-delete-error'),
		});
	};

	return (
		<Dialog>
			<DialogTrigger asChild>{props.trigger}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('account-delete')}</DialogTitle>
					<DialogDescription>
						<span className='text-red-500 font-semibold'>
							{t('account-delete-attention')}
						</span>{' '}
						{t('account-delete-text')}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleDeleteAccount}>
					<div className='flex flex-col space-y-3 text-neutral-700'>
						<p className='text-sm text-center'>
							{t('account-delete-prompt')}{' '}
							<span className='font-semibold'>{props.email}</span>
						</p>
						<Input
							type='email'
							className='input'
							onChange={(e: any) => setConfirmEmail(e.target.value)}
							placeholder={t('email')}
							disabled={loading}
						/>
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
								disabled={loading || confirmEmail !== props.email}
								type='submit'
								variant='destructive'>
								{loading ?? (
									<LoaderIcon size={16} className='animate-spin' />
								)}
								<span>{loading ? t('deleting') : t('delete')}</span>
							</Button>
						</DialogFooter>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
};
