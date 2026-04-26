'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'

import { cn } from '@/utils'
import { Button, FormControl, InputGlobalStyles } from '@/ui'

interface IngredientSelectorProps {
	values: string[]
	setValues: (value: string[]) => void
	disabled?: boolean
}

const hasMeaningfulIngredientText = (value: string) =>
	(value.match(/\p{Script=Latin}/gu)?.length ?? 0) >= 2

export const IngredientSelector = ({
	values,
	setValues,
	disabled = false,
}: IngredientSelectorProps) => {
	const t = useTranslations('RecipesPage')
	const [currIngredient, setCurrIngredient] = useState<string>('')

	const pendingIngredients = useMemo(
		() =>
			currIngredient
				.split(/[,\n]/)
				.map((ingredient) => ingredient.trim())
				.filter(hasMeaningfulIngredientText),
		[currIngredient],
	)
	const showInvalidIngredient =
		currIngredient.trim() !== '' && pendingIngredients.length === 0
	const canAdd = !disabled && pendingIngredients.length > 0

	function addIngredients(ingredients: string[]) {
		if (disabled) return
		if (ingredients.length === 0) return
		setValues([...values, ...ingredients])
		setCurrIngredient('')
	}

	function addCurrentIngredient() {
		addIngredients(pendingIngredients)
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key !== 'Enter') return
		event.preventDefault()
		addCurrentIngredient()
	}

	function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
		const pasted = event.clipboardData.getData('text')
		if (!/[,\n]/.test(pasted)) return

		event.preventDefault()
		addIngredients(
			pasted
				.split(/[,\n]/)
				.map((ingredient) => ingredient.trim())
				.filter(hasMeaningfulIngredientText),
		)
	}

	return (
		<>
			<FormControl>
				<div className='my-2 flex items-center gap-2'>
					<input
						value={currIngredient}
						className={cn(
							InputGlobalStyles,
							'rounded-2xl py-5 bg-forest-50 border-2 focus-visible:ring-0',
						)}
						placeholder={t('ingredients-placeholder')}
						disabled={disabled}
						onChange={(e) => setCurrIngredient(e.currentTarget.value)}
						onKeyDown={handleKeyDown}
						onPaste={handlePaste}
					/>
					<Button
						type='button'
						className='shrink-0'
						disabled={!canAdd}
						onClick={addCurrentIngredient}>
						<b>{t('ingredients-add')}</b>
					</Button>
				</div>
			</FormControl>
			{showInvalidIngredient && (
				<p className='mt-1 text-left text-[0.8rem] font-bold text-forest-400'>
					{t('ingredients-invalid')}
				</p>
			)}
			<div className='flex flex-wrap justify-center gap-1.5 mt-2'>
				{values.map((ingredient, index) => (
					<span
						key={index}
						className='inline-flex items-center gap-1 text-xs font-semibold text-forest-300 bg-forest-150 ps-2.5 pe-1 py-1 rounded-lg'>
						<span>{ingredient}</span>
						<button
							type='button'
							aria-label={t('ingredients-remove', {
								ingredient,
							})}
							disabled={disabled}
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
