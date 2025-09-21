'use client'

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'

import { Categories } from '@/types'
import { cn } from '@/utils'
import { Icon } from '../../recipes/icon'

interface CategorySelectorProps {
	value?: string
	setValue: (value: string) => void
}

export const CategorySelector = ({ value, setValue }: CategorySelectorProps) => {
	const t = useTranslations('RecipeCategories')

	return (
		<div className='flex overflow-x-scroll no-scrollbar py-2 snap-x '>
			{Categories.map((categoryName) => {
				const isActive = value === categoryName
				return (
					<button
						type='button'
						onClick={() => setValue(categoryName as Categories)}
						key={categoryName}
						className={cn(
							'relative snap-center flex flex-col min-w-[4.5rem] py-3 mx-1 bg-forest-200/15 rounded items-center justify-center shadow-sm',
							'transition-all duration-400 hover:scale-[1.05] border-2 border-forest-200/15',
							isActive && 'border-forest-200 '
						)}>
						<Icon name={categoryName} size={24} />
						<span className='text-xs text-forest-200/75 pt-3'>
							{t(categoryName.toLowerCase())}
						</span>
						<div
							className={cn(
								'absolute -top-1 -right-1 bg-[#fefff2] border-2 border-forest-200 rounded',
								'transition-opacity duration-300',
								isActive ? 'opacity-100' : 'opacity-0'
							)}>
							<Check size={14} color={'#789B84'} />
						</div>
					</button>
				)
			})}
		</div>
	)
}
