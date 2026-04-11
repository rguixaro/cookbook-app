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
		const prev = isFavourited
		setIsFavourited(!prev)
		try {
			const { error } = await favouriteRecipe(recipeId, prev)
			if (error) throw new Error()
			toast.success(t(prev ? 'recipe-unfavourited' : 'recipe-favourited'))
		} catch {
			setIsFavourited(prev)
			toast.error(t('error'))
		}
	}

	return (
		<button
			onClick={() => onFavouriteRecipe()}
			className='hover:bg-forest-100 p-1 rounded-xl transition-colors duration-300'>
			<HeartIcon filled={isFavourited} color='#789b84' />
		</button>
	)
}
