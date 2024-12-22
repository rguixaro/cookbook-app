import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FileQuestion } from 'lucide-react';

import { TypographyH4 } from '@/ui';

export default async function NotFound() {
	const t = await getTranslations('common');

	return (
		<div className='mt-32 flex flex-col items-center justify-center text-forest-200'>
			<FileQuestion size={24} />
			<TypographyH4 className='mt-2 mb-5'>{t('user-not-found')}</TypographyH4>
			<Link href='/' className='mt-5 underline font-medium'>
				{t('return')}
			</Link>
		</div>
	);
}
