import { getTranslations } from 'next-intl/server'
import { Utensils } from 'lucide-react'

import { getRecipesByUserId } from '@/server/queries'
import { ItemRecipe } from '@/components/recipes/item'
import { Info } from '@/components/recipes/info'
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
	const t = await getTranslations('RecipesPage')

	const filteredRecipes = data?.recipes.filter((recipe) => {
		if (!searchParam && !categoryParam) return true
		else if (categoryParam && recipe.category !== categoryParam) return false
		return (
			!searchParam ||
			recipe.name.toLowerCase().includes(searchParam.toLowerCase())
		)
	})

	const sortedRecipes = filteredRecipes?.sort((a, b) => {
		return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	})

	return (
		<div className='w-full h-full flex flex-col items-center'>
			{sortedRecipes?.map((recipe, index) => (
				<div
					key={recipe.id}
					className='w-full h-full items-center justify-center flex flex-col'>
					<ItemRecipe
						key={recipe.id}
						recipe={recipe}
						referred={referred}
						query={searchParam}
						category={categoryParam}
					/>
				</div>
			))}
			{referred ? (
				filteredRecipes?.length === 0 && (
					<div className='h-32 flex flex-col items-center justify-center text-forest-200'>
						<TypographyH4>{t('not-found')}</TypographyH4>
						<Utensils size={24} className='mt-2 mb-5' />
					</div>
				)
			) : (
				<Info enabled={filteredRecipes?.length === 0} />
			)}
		</div>
	)
}
