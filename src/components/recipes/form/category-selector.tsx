'use client'

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'

import { RecipeCategories, type RecipeCategory } from '@/types'
import { cn } from '@/utils'
import { Icon } from '../../recipes/icon'

interface CategorySelectorProps {
	values?: RecipeCategory[]
	setValues: (values: RecipeCategory[]) => void
	disabled?: boolean
	max?: number
}

export const CategorySelector = ({
	values = [],
	setValues,
	disabled = false,
	max = 3,
}: CategorySelectorProps) => {
	const t = useTranslations('RecipeCategories')

	function toggle(category: RecipeCategory) {
		if (values.includes(category)) {
			setValues(values.filter((value) => value !== category))
			return
		}

		if (values.length >= max) return
		setValues([...values, category])
	}

	return (
		<div className='overflow-x-scroll no-scrollbar py-3 snap-x'>
			<div className='flex w-max mx-auto px-4'>
				{RecipeCategories.map((categoryName) => {
					const isActive = values.includes(categoryName)
					const isDisabled = disabled || (!isActive && values.length >= max)

					return (
						<button
							type='button'
							onClick={() => toggle(categoryName)}
							disabled={isDisabled}
							key={categoryName}
							className={cn(
								'relative snap-center flex flex-col min-w-18 py-3 mx-1 bg-forest-50 rounded-2xl items-center justify-center shadow-center-sm',
								'transition-all duration-400 hover:scale-[1.05] border-2 border-forest-150 text-forest-200',
								'disabled:pointer-events-none disabled:opacity-50',
								isActive
									? 'border-transparent bg-forest-200/75 text-forest-50 stroke-forest-50'
									: 'hover:border-transparent hover:bg-forest-200/75 hover:text-forest-50 hover:stroke-forest-50',
							)}
						>
							<Icon name={categoryName} size={24} className='' />
							<span className={cn('text-xs pt-3', isActive && 'font-bold')}>
								{t(categoryName.toLowerCase())}
							</span>
						</button>
					)
				})}
			</div>
		</div>
	)
}
