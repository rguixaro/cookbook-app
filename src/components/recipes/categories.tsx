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
			<DialogContent className='md:w-fit flex flex-col items-center text-center'>
				<DialogHeader>
					<DialogTitle className='text-center text-forest-400'>
						<span className='font-bold'>{t('categories')}</span>
					</DialogTitle>
					<DialogDescription className='text-center text-forest-400'>
						<span className='font-medium'>{t('categories-select')}</span>
					</DialogDescription>
				</DialogHeader>
				<div className='w-fit grid grid-cols-2 place-items-center gap-x-2 gap-y-4'>
					{CategoriesList.map((category) => (
						<Button
							key={category}
							onClick={() => select(category)}
							className={cn(
								'w-full h-20 max-w-40 flex flex-col items-start space-x-0 bg-forest-200/15 text-forest-200 rounded border-2 border-forest-200/15 hover:bg-forest-200/30',
								selected === category &&
									'border-forest-200 bg-forest-200/30'
							)}>
							<Icon name={category} size={24} />
							<span className='font-bold mt-2'>
								{/* @ts-expect-error: Unnecessary message type */}
								{t_categories(category.toLowerCase())}
							</span>
						</Button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}
