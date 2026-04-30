'use client'

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'

import { RecipeCourses, type RecipeCourse } from '@/types'
import { cn } from '@/utils'
import { Icon } from '../../recipes/icon'

interface CourseSelectorProps {
	value?: string
	setValue: (value: string) => void
	disabled?: boolean
}

export const CourseSelector = ({
	value,
	setValue,
	disabled = false,
}: CourseSelectorProps) => {
	const t = useTranslations('RecipeCourses')

	return (
		<div className='overflow-x-scroll no-scrollbar py-3 snap-x'>
			<div className='flex w-max mx-auto px-4'>
				{RecipeCourses.map((categoryName) => {
					const isActive = value === categoryName
					return (
						<button
							type='button'
							onClick={() => setValue(categoryName as RecipeCourse)}
							disabled={disabled}
							key={categoryName}
							className={cn(
								'relative snap-center flex flex-col min-w-18 py-3 mx-1 bg-forest-50 rounded-2xl items-center justify-center shadow-center-sm',
								'transition-all duration-400 hover:scale-[1.03] border-2 border-forest-150 text-forest-200',
								'disabled:pointer-events-none disabled:opacity-50',
								isActive
									? 'border-transparent bg-forest-200/75 text-forest-50 stroke-forest-50'
									: 'hover:border-transparent hover:bg-forest-200/75 hover:text-forest-50 hover:stroke-forest-50',
							)}>
							<Icon name={categoryName} size={24} className='' />
							<span
								className={cn(
									'text-xs pt-3',
									isActive && 'font-bold',
								)}>
								{t(categoryName.toLowerCase())}
							</span>
						</button>
					)
				})}
			</div>
		</div>
	)
}
