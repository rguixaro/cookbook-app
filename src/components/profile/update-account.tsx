'use client';

import { use, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { AlertTriangleIcon, LoaderIcon, SaveIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';

import { updateProfile } from '@/server/actions';
import { UpdateProfileSchema } from '@/server/schemas';
import { useCopyToClipboard } from '@/hooks';
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
} from '@/ui';
import { ProfileCard } from './card';
import { DeleteAccount } from './delete-account';

interface UpdateAccountProps {
	name: string;
	username: string;
	email: string;
}

export const UpdateAccount = (props: UpdateAccountProps) => {
	const t = useTranslations('ProfilePage');
	const url = 'https://cookbook.rguixaro.dev';

	const { copy } = useCopyToClipboard();

	const [loading, setLoading] = useState<boolean>(false);

	const hookForm = useForm<z.infer<typeof UpdateProfileSchema>>({
		resolver: zodResolver(UpdateProfileSchema),
		defaultValues: {
			name: props.name,
			username: props.username,
			email: props.email,
		},
	});

	const onSubmit = async (values: z.infer<typeof UpdateProfileSchema>) => {
		try {
			setLoading(true);
			await updateProfile(values);
			toast.success('Profile updated successfully.');
		} catch (error) {
			toast.error('An unexpected error has occurred. Please try again later.');
		} finally {
			setLoading(false);
		}
	};

	const handleCopy = (text: string) => () => {
		copy(text)
			.then(() => {
				toast.success('Link copied to clipboard');
			})
			.catch((error) => {
				toast.error(
					'An unexpected error has occurred. Please try again later.',
					{ description: error }
				);
			});
	};

	const ShareComponent = () => {
		return (
			<button
				onClick={handleCopy(`${url}/${props.email}`)}
				className='bg-forest-200 text-white font-bold rounded-lg text-xs md:text-sm px-2 py-1 transition-colors duration-300 hover:bg-forest-200/80'>
				<span>{t('share')}</span>
			</button>
		);
	};

	return (
		<ProfileCard
			title={t('title')}
			description={t('description')}
			action={<ShareComponent />}>
			<Form {...hookForm}>
				<form
					onSubmit={hookForm.handleSubmit(onSubmit)}
					className='space-y-5 mb-5 text-neutral-700'>
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
								<FormDescription className='flex items-center gap-2 pl-1'>
									<AlertTriangleIcon size={24} />
									<span>{t('email-hint')}</span>
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className='flex items-center'>
						<Button
							type='submit'
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
			<DeleteAccount
				email={props.email!}
				trigger={
					<Button variant='destructive' size='sm' className='w-1/2'>
						<span className='font-bold'>{t('account-delete')}</span>
					</Button>
				}
			/>
		</ProfileCard>
	);
};
