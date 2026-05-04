'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Trash2 } from 'lucide-react'

import { Button, Textarea } from '@/ui'
import {
	RecipeComplementTypes,
	type RecipeComplement as PersistedRecipeComplement,
	type RecipeComplementType,
} from '@/types'
import { IngredientSelector } from './ingredient-selector'

export interface RecipeComplement {
	id: string
	type: RecipeComplementType
	ingredients: string[]
	instructions: string
}

export type RecipeComplementErrors = Record<
	string,
	{
		ingredients?: string
		instructions?: string
	}
>

const createComplementId = () =>
	typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: `${Date.now()}-${Math.random()}`

export function createRecipeComplement(
	type: RecipeComplementType,
): RecipeComplement {
	return {
		id: createComplementId(),
		type,
		ingredients: [],
		instructions: '',
	}
}

export function createRecipeComplementFromValue(
	complement: PersistedRecipeComplement,
): RecipeComplement {
	return {
		id: createComplementId(),
		...complement,
	}
}

export function serializeRecipeComplements({
	complements,
}: {
	complements: RecipeComplement[]
}) {
	return complements.map(({ type, ingredients, instructions }) => ({
		type,
		ingredients,
		instructions: instructions.trim(),
	}))
}

export function validateRecipeComplements(
	complements: RecipeComplement[],
): RecipeComplementErrors {
	const errors: RecipeComplementErrors = {}

	for (const complement of complements) {
		const complementErrors: RecipeComplementErrors[string] = {}

		if (complement.ingredients.length === 0) {
			complementErrors.ingredients = 'ingredients-required'
		}

		if (Object.keys(complementErrors).length > 0) {
			errors[complement.id] = complementErrors
		}
	}

	return errors
}

export const hasRecipeComplementErrors = (errors: RecipeComplementErrors) =>
	Object.keys(errors).length > 0

interface RecipeComplementsInputProps {
	complements: RecipeComplement[]
	setComplements: (complements: RecipeComplement[]) => void
	errors?: RecipeComplementErrors
	disabled?: boolean
}

export function RecipeComplementsInput({
	complements,
	setComplements,
	errors = {},
	disabled = false,
}: RecipeComplementsInputProps) {
	const t = useTranslations('RecipesPage')
	const t_errors = useTranslations('errors')
	const [inputErrors, setInputErrors] = useState<Record<string, string | null>>({})

	function addComplement(type: RecipeComplementType) {
		setComplements([...complements, createRecipeComplement(type)])
	}

	function updateComplement(
		id: string,
		updates: Partial<Omit<RecipeComplement, 'id' | 'type'>>,
	) {
		setComplements(
			complements.map((complement) =>
				complement.id === id ? { ...complement, ...updates } : complement,
			),
		)
	}

	function removeComplement(id: string) {
		setInputErrors((current) => {
			const { [id]: _removed, ...next } = current
			return next
		})
		setComplements(complements.filter((complement) => complement.id !== id))
	}

	const availableTypes = RecipeComplementTypes.filter(
		(type) => !complements.some((complement) => complement.type === type),
	)

	return (
		<div className='mt-3 space-y-3 px-4'>
			{availableTypes.length > 0 && (
				<div className='flex flex-wrap justify-center gap-2'>
					{availableTypes.map((type) => (
						<Button
							key={type}
							type='button'
							size='sm'
							className='bg-forest-200/50'
							disabled={disabled}
							onClick={() => addComplement(type)}>
							<span className='font-bold'>
								{t(`complement-add-${type.toLowerCase()}`)}
							</span>
						</Button>
					))}
				</div>
			)}
			{complements.map((complement) => {
				const ingredientError =
					inputErrors[complement.id] ?? errors[complement.id]?.ingredients
				const instructionError = errors[complement.id]?.instructions

				return (
					<div
						key={complement.id}
						className='rounded-2xl border-2 border-forest-150 bg-forest-150 p-3 text-left shadow-center-sm'>
						<div className='flex items-center justify-between gap-2'>
							<span className='w-fit self-center text-xs font-bold text-forest-50 bg-forest-200/75 px-2 py-1 rounded-lg'>
								{t(`complement-${complement.type.toLowerCase()}`)}
							</span>
							<button
								type='button'
								aria-label={t('complement-remove', {
									complement: t(
										`complement-${complement.type.toLowerCase()}`,
									),
								})}
								className='rounded-lg p-2 text-forest-200 transition-colors hover:bg-forest-150 hover:text-forest-400 disabled:opacity-50'
								disabled={disabled}
								onClick={() => removeComplement(complement.id)}>
								<Trash2 size={15} />
							</button>
						</div>
						<div className='mt-3 rounded-xl bg-forest-100 py-3'>
							<p className='text-center text-sm font-extrabold text-forest-200'>
								{t('ingredients')}
							</p>
							<IngredientSelector
								values={complement.ingredients}
								setValues={(ingredients) =>
									updateComplement(complement.id, { ingredients })
								}
								disabled={disabled}
								showFormMessage={false}
								showPlaceholder={false}
								onInputErrorChange={(message) =>
									setInputErrors((current) => {
										if (current[complement.id] === message) {
											return current
										}
										return {
											...current,
											[complement.id]: message,
										}
									})
								}
							/>
							{ingredientError && (
								<p className='text-xs mt-3 font-bold text-forest-200/75 bg-forest-50 mx-5 px-2 py-1 my-1 rounded-lg text-center'>
									{t_errors(ingredientError)}
								</p>
							)}
						</div>
						<div className='mt-3'>
							<p className='mb-2 text-center text-sm font-extrabold text-forest-200'>
								{t('instructions')}
							</p>
							<Textarea
								value={complement.instructions}
								autoResize
								onKeyDown={(event) => event.stopPropagation()}
								className='border-2 bg-forest-100 text-forest-200 shadow-none placeholder:text-forest-200/75'
								disabled={disabled}
								onChange={(event) =>
									updateComplement(complement.id, {
										instructions: event.currentTarget.value,
									})
								}
							/>
							{instructionError && (
								<p className='text-xs mt-3 font-bold text-forest-200/75 bg-forest-50 px-2 py-1 my-1 rounded-lg text-center'>
									{t_errors(instructionError)}
								</p>
							)}
						</div>
					</div>
				)
			})}
		</div>
	)
}
