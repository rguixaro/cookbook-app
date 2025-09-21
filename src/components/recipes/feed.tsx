import { getTranslations } from 'next-intl/server'
import { Utensils } from 'lucide-react'

import { getRecipesByUserId } from '@/server/queries'
import { Info } from '@/components/layout'
import { ItemRecipe } from '@/components/recipes/item'
import { TypographyH4 } from '@/ui'

export const RecipesFeed = async ({
	searchParam,
	categoryParam,
	userId,
	referred = false,
}: {
	searchParam?: string
	categoryParam?: string
	userId?: string
	referred?: boolean
}) => {
	const data = await getRecipesByUserId(userId)
	const t = await getTranslations('common')

	const normalize = (str = '') =>
		str
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.trim()
			.replace(/\s+/g, ' ')

	const filteredRecipes = data?.recipes.filter((recipe) => {
		if (!searchParam && !categoryParam) return true
		if (categoryParam && recipe.category !== categoryParam) return false

		const query = normalize(searchParam || '')
		const name = normalize(recipe.name)

		return !query || name.includes(query)
	})

	const sortedRecipes = filteredRecipes?.sort((a, b) => {
		return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	})

	return (
		<div className='w-full h-full flex flex-col items-center'>
			{sortedRecipes?.map((recipe) => (
				<ItemRecipe
					key={recipe.id}
					recipe={recipe}
					referred={referred}
					query={searchParam}
					category={categoryParam}
				/>
			))}
			{referred ? (
				filteredRecipes?.length === 0 && (
					<div className='mt-10 h-32 flex flex-col items-center justify-center text-forest-200'>
						<TypographyH4>{t('no-recipes')}</TypographyH4>
						<Utensils size={24} className='mt-2 mb-5' />
					</div>
				)
			) : (
				<Info enabled={filteredRecipes?.length === 0} mode='recipes' />
			)}
		</div>
	)
}
