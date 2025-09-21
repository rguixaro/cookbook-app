import { useTranslations } from 'next-intl'
import Link from 'next/link'

import { cn } from '@/utils'

export const AddRecipe = ({ className }: { className?: string }) => {
	const t = useTranslations('RecipesPage')

	return (
		<Link
			href='/recipes/new'
			className={cn(
				'bg-forest-200 py-3 px-5 rounded shadow text-white',
				className
			)}>
			<span className='text-base md:text-lg font-bold'>{t('add')}</span>
		</Link>
	)
}
