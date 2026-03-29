'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, X } from 'lucide-react'

import { cn } from '@/utils'
import { FormControl, InputGlobalStyles } from '@/ui'

interface IngredientSelectorProps {
	values: string[]
	setValues: (value: string[]) => void
}

export const IngredientSelector = ({
	values,
	setValues,
}: IngredientSelectorProps) => {
	const t = useTranslations('RecipesPage')
	const [currIngredient, setCurrIngredient] = useState<string>('')

	useEffect(() => {
		if (values.length > 0) setValues(values)
	}, [values, setValues])

	function addIngredient(event?: React.KeyboardEvent<HTMLInputElement>) {
		if (event && event.key !== 'Enter') return
		const trimmed = currIngredient.trim()
		if (!trimmed) return
		setValues([...values, trimmed])
		setCurrIngredient('')
		event?.preventDefault()
	}

	return (
		<>
			<FormControl>
				<div className='relative my-2'>
					<button
						type='button'
						className='absolute left-2 top-1/2 transform -translate-y-1/2 focus-visible:outline-none focus-visible:ring-0'
						onClick={() => addIngredient()}>
						<Plus className='stroke-forest-200' size={24} />
					</button>
					<input
						value={currIngredient}
						className={cn(
							InputGlobalStyles,
							'rounded-2xl ps-10 py-5 bg-forest-50 border-2',
						)}
						placeholder={t('ingredients-add')}
						onChange={(e) => setCurrIngredient(e.currentTarget.value)}
						onKeyDown={addIngredient}
					/>
				</div>
			</FormControl>
			<div className='flex flex-wrap justify-center gap-1.5 mt-2'>
				{values.map((ingredient, index) => (
					<span
						key={index}
						className='inline-flex items-center gap-1 text-xs font-semibold text-forest-300 bg-forest-150 ps-2.5 pe-1 py-1 rounded-lg'>
						<span>{ingredient}</span>
						<button
							type='button'
							className='hover:text-forest-400 transition-colors'
							onClick={() =>
								setValues(values.filter((_, i) => i !== index))
							}>
							<X size={12} />
						</button>
					</span>
				))}
			</div>
		</>
	)
}
