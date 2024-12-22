import { getTranslations } from 'next-intl/server';
import { UtensilsCrossed } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui';
import { SocialLogin } from '@/components/auth';
import { cn } from '@/utils';

export default async function LoginPage() {
	const t = await getTranslations('LoginPage');

	return (
		<Card
			className={cn(
				'w-full max-w-sm',
				'duration-300 animate-in fade-in-15 slide-in-from-bottom-3'
			)}>
			<CardHeader className='flex items-center justify-center text-center text-forest-300'>
				<UtensilsCrossed size={48} />
				<CardTitle className='text-2xl md:text-3xl font-medium duration-500 animate-in fade-in-20 py-5'>
					{t('login-to')}
					<p className='font-title font-bold text-3xl md:text-4xl'>
						{t('login-name')}
					</p>
				</CardTitle>
				<CardDescription className='duration-500 animate-in fade-in-30 mt-5 font-medium text-forest-200 text-base md:text-lg'>
					{t('login-text')}
				</CardDescription>
			</CardHeader>
			<CardContent className='grid gap-4 duration-500 animate-in fade-in-30'>
				<SocialLogin />
			</CardContent>
		</Card>
	);
}
