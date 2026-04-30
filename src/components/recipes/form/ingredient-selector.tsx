'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'

import { cn } from '@/utils'
import { Button, FormControl, FormMessage, InputGlobalStyles } from '@/ui'

interface IngredientSelectorProps {
	values: string[]
	setValues: (value: string[]) => void
	disabled?: boolean
	onInputErrorChange?: (message: string | null) => void
}

const INGREDIENT_MAX_LENGTH = 30

const hasMeaningfulIngredientText = (value: string) =>
	(value.match(/\p{Script=Latin}/gu)?.length ?? 0) >= 2

const isValidIngredient = (value: string) =>
	value.length <= INGREDIENT_MAX_LENGTH && hasMeaningfulIngredientText(value)

export const IngredientSelector = ({
	values,
	setValues,
	disabled = false,
	onInputErrorChange,
}: IngredientSelectorProps) => {
	const t = useTranslations('RecipesPage')
	const [currIngredient, setCurrIngredient] = useState<string>('')

	const pendingIngredients = useMemo(
		() =>
			currIngredient
				.split(/[,\n]/)
				.map((ingredient) => ingredient.trim())
				.filter(isValidIngredient),
		[currIngredient],
	)
	const hasIngredientTooLong = currIngredient
		.split(/[,\n]/)
		.map((ingredient) => ingredient.trim())
		.some((ingredient) => ingredient.length > INGREDIENT_MAX_LENGTH)
	const showInvalidIngredient =
		currIngredient.trim() !== '' &&
		pendingIngredients.length === 0 &&
		!hasIngredientTooLong
	const inputError = hasIngredientTooLong
		? 'ingredient-too-long'
		: showInvalidIngredient
			? 'ingredient-invalid'
			: null
	const inputErrorMessage = inputError
		? inputError === 'ingredient-invalid'
			? 'ingredients-invalid'
			: inputError
		: null
	const canAdd = !disabled && pendingIngredients.length > 0

	useEffect(() => {
		onInputErrorChange?.(inputError)
	}, [inputError, onInputErrorChange])

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
				.filter(isValidIngredient),
		)
	}

	return (
		<>
			<FormControl>
				<div
					className={cn(
						'mt-3 flex items-center gap-2 mx-4',
						values.length > 0 && 'my-3',
					)}
				>
					<input
						value={currIngredient}
						aria-label={t('ingredients')}
						className={cn(
							InputGlobalStyles,
							'rounded-2xl py-5 bg-forest-50 border-2 focus-visible:ring-0 placeholder:text-forest-200/75',
						)}
						placeholder={t('ingredients-placeholder')}
						disabled={disabled}
						maxLength={INGREDIENT_MAX_LENGTH}
						onChange={(e) => setCurrIngredient(e.currentTarget.value)}
						onKeyDown={handleKeyDown}
						onPaste={handlePaste}
					/>
					<Button
						type='button'
						className='shrink-0 py-5'
						disabled={!canAdd}
						onClick={addCurrentIngredient}
					>
						<b>{t('ingredients-add')}</b>
					</Button>
				</div>
			</FormControl>
			<FormMessage className={cn('mb-0 mt-0', values.length == 0 && 'mt-3')} />
			{inputErrorMessage && !onInputErrorChange && (
				<p className='mt-1 text-left text-[0.8rem] font-bold text-forest-400'>
					{t(inputErrorMessage)}
				</p>
			)}
			<div
				className={cn(
					'flex flex-wrap justify-center gap-1.5 mt-0',
					values.length > 0 && 'mt-3',
				)}
			>
				{values.map((ingredient, index) => (
					<span
						key={index}
						className='inline-flex items-center gap-1 text-xs font-semibold text-forest-200 bg-forest-150 ps-2.5 pe-1 py-1 rounded-lg'
					>
						<span>{ingredient}</span>
						<button
							type='button'
							aria-label={t('ingredients-remove', {
								ingredient,
							})}
							disabled={disabled}
							className='hover:text-forest-400 transition-colors'
							onClick={() => setValues(values.filter((_, i) => i !== index))}
						>
							<X size={12} />
						</button>
					</span>
				))}
			</div>
		</>
	)
}
