'use client'

import { useTranslations } from 'next-intl'
import { Share2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { Recipe } from '@/types'
import { useCopyToClipboard } from '@/hooks'
import { SITE_URL } from '@/utils'

export const RecipeShare = ({ recipe }: { recipe: Recipe | null }) => {
	const t_toasts = useTranslations('toasts')

	const { copy } = useCopyToClipboard()

	const handleCopy = (text: string) => () => {
		copy(text)
			.then(() => {
				toast.success(t_toasts('recipe-link-copied'))
			})
			.catch(() => {
				toast.error(t_toasts('error'))
			})
	}

	if (!recipe) return null

	return (
		<button
			onClick={handleCopy(
				`${SITE_URL}/recipes/${recipe.authorUsername}/${recipe.slug}`,
			)}
			className='hover:bg-forest-100 p-1 rounded-xl transition-colors duration-300'>
			<Share2Icon size={24} className='text-forest-200' />
		</button>
	)
}
