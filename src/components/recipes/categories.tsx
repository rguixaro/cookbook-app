'use client'

import { useState, ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { Categories as CategoriesList } from '@/server/schemas'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Button,
} from '@/ui'
import { Icon } from './icon'
import { cn } from '@/utils'
import { Check } from 'lucide-react'

interface CategoriesProps {
	trigger: ReactNode
	selected: string | null
	onSelect: (category: string) => void
}

export const Categories = ({ trigger, onSelect, selected }: CategoriesProps) => {
	const t = useTranslations('RecipesPage')
	const t_categories = useTranslations('RecipeCategories')

	const [isOpen, setIsOpen] = useState(false)
	function select(category: string) {
		onSelect(category)
		setIsOpen(false)
	}

	return (
		<Dialog open={isOpen} defaultOpen={false} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className='md:w-fit flex flex-col items-center text-center bg-forest-100'>
				<DialogHeader>
					<DialogTitle className='text-center text-forest-300'>
						<span className='font-bold'>{t('categories')}</span>
					</DialogTitle>
					<DialogDescription className='text-center text-forest-200'>
						<span className='font-medium'>{t('categories-select')}</span>
					</DialogDescription>
				</DialogHeader>
				<div className='w-fit grid grid-cols-2 place-items-center gap-x-2 gap-y-4'>
					{CategoriesList.map((category) => (
						<Button
							key={category}
							onClick={() => select(category)}
							className={cn(
								'relative w-full h-20 max-w-40 flex flex-col items-start space-x-0 shadow-center-sm',
								'bg-forest-50 text-forest-200 rounded-2xl border-2 border-forest-150 hover:bg-forest-50',
								'transition-all duration-400 hover:scale-[1.05]',
								selected === category && 'border-forest-200 ',
							)}>
							<Icon name={category} size={24} />
							<span className='font-bold mt-2'>
								{t_categories(category.toLowerCase())}
							</span>
							<div
								className={cn(
									'absolute -top-1 -right-1 bg-forest-50 border-2 border-forest-200 rounded-lg',
									'transition-opacity duration-300',
									selected === category
										? 'opacity-100'
										: 'opacity-0',
								)}>
								<Check size={16} className='stroke-forest-200' />
							</div>
						</Button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}
