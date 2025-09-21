'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { saveRecipe } from '@/server/actions'
import { BookmarkIcon } from '../icons'

export const SavedStatus = ({
	initial = false,
	recipeId,
}: {
	initial?: boolean
	recipeId: string
}) => {
	const t = useTranslations('toasts')
	const [isRecipeSaved, setIsSaved] = useState<boolean>(initial)

	async function onSaveRecipe() {
		try {
			const { error } = await saveRecipe(recipeId, isRecipeSaved)
			if (error) throw new Error()
			toast.success(t(isRecipeSaved ? 'recipe-deleted' : 'recipe-saved'))
			setIsSaved((prev) => !prev)
		} catch (error) {
			toast.success(t('error'))
		}
	}

	return (
		<button
			onClick={() => onSaveRecipe()}
			className='hover:bg-forest-200/15 p-1 rounded transition-colors duration-300'>
			<BookmarkIcon filled={isRecipeSaved} />
		</button>
	)
}
