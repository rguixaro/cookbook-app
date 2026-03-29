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
		const prev = isRecipeSaved
		setIsSaved(!prev)
		try {
			const { error } = await saveRecipe(recipeId, prev)
			if (error) throw new Error()
			toast.success(t(prev ? 'recipe-deleted' : 'recipe-saved'))
		} catch {
			setIsSaved(prev)
			toast.error(t('error'))
		}
	}

	return (
		<button
			onClick={() => onSaveRecipe()}
			className='hover:bg-forest-100 p-1 rounded-xl transition-colors duration-300'>
			<BookmarkIcon filled={isRecipeSaved} />
		</button>
	)
}
