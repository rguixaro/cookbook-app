import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { CircleX } from 'lucide-react';

import { TypographyH4 } from '@/ui';

export default async function AuthErrorPage() {
	const t = await getTranslations('toasts');
	const t_common = await getTranslations('common');

	return (
		<div className='mt-32 flex flex-col items-center justify-center text-forest-200'>
			<CircleX size={48} />
			<TypographyH4 className='mt-2 mb-5'>{t('error')}</TypographyH4>
			<Link href='/' className='mt-5 underline font-medium'>
				{t_common('return')}
			</Link>
		</div>
	);
}
