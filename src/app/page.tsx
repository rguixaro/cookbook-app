import { RecipesFeed, SearchRecipes } from '@/components/recipes'

export default async function RecipesPage({
	searchParams,
}: {
	searchParams?: Promise<{
		search?: string
		category?: string
		favourites?: string
	}>
}) {
	const params = await searchParams
	const searchParam = params?.search
	const categoryParam = params?.category
	const favouritesParam = params?.favourites === 'true'

	return (
		<main className='flex flex-col items-center text-forest-400 w-full h-full'>
			<SearchRecipes />
			<div className='w-10/12 sm:w-2/4 lg:w-2/6'>
				<RecipesFeed
					searchParam={searchParam}
					categoryParam={categoryParam}
					favouritesParam={favouritesParam}
				/>
			</div>
		</main>
	)
}
