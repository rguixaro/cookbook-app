'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { favouriteRecipe } from '@/server/actions'
import { HeartIcon } from '../icons'

export const FavouriteStatus = ({
	initial = false,
	recipeId,
}: {
	initial?: boolean
	recipeId: string
}) => {
	const t = useTranslations('toasts')
	const [isFavourited, setIsFavourited] = useState<boolean>(initial)

	async function onFavouriteRecipe() {
		try {
			const { error } = await favouriteRecipe(recipeId, isFavourited)
			if (error) throw new Error()
			toast.success(
				t(isFavourited ? 'recipe-unfavourited' : 'recipe-favourited'),
			)
			setIsFavourited((prev) => !prev)
		} catch {
			toast.error(t('error'))
		}
	}

	return (
		<button
			onClick={() => onFavouriteRecipe()}
			className='hover:bg-forest-200/15 p-1 rounded-xl transition-colors duration-300'>
			<HeartIcon filled={isFavourited} />
		</button>
	)
}
