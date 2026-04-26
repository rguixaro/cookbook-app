'use client'

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'

import { Categories } from '@/types'
import { cn } from '@/utils'
import { Icon } from '../../recipes/icon'

interface CategorySelectorProps {
	value?: string
	setValue: (value: string) => void
	disabled?: boolean
}

export const CategorySelector = ({
	value,
	setValue,
	disabled = false,
}: CategorySelectorProps) => {
	const t = useTranslations('RecipeCategories')

	return (
		<div className='flex overflow-x-scroll no-scrollbar py-2 snap-x'>
			{Categories.map((categoryName) => {
				const isActive = value === categoryName
				return (
					<button
						type='button'
						onClick={() => setValue(categoryName as Categories)}
						disabled={disabled}
						key={categoryName}
						className={cn(
							'relative snap-center flex flex-col min-w-18 py-3 mx-1 bg-forest-50 rounded-2xl items-center justify-center shadow-center-sm',
							'transition-all duration-400 hover:scale-[1.05] border-2 border-forest-150',
							'disabled:pointer-events-none disabled:opacity-50',
							isActive && 'border-forest-200',
						)}>
						<Icon name={categoryName} size={24} />
						<span
							className={cn(
								'text-xs text-forest-200 pt-3',
								isActive && 'font-bold',
							)}>
							{t(categoryName.toLowerCase())}
						</span>
						<div
							className={cn(
								'absolute -top-1 -right-1 bg-forest-50 border-2 border-forest-200 rounded-lg',
								'transition-opacity duration-300',
								isActive ? 'opacity-100' : 'opacity-0',
							)}>
							<Check size={16} className='stroke-forest-200' />
						</div>
					</button>
				)
			})}
		</div>
	)
}
