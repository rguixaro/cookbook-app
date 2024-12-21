import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { cn } from '@/utils';

export const AddRecipe = ({ className }: { className?: string }) => {
	const t = useTranslations('RecipesPage');

	return (
		<Link
			href='/recipes/new'
			className={cn(
				'bg-forest-200 p-2 px-5 rounded-2xl shadow font-bold text-white',
				className
			)}>
			<span className='text-base md:text-lg'>{t('add')}</span>
		</Link>
	);
};
