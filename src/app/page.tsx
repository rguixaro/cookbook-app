import { RecipesFeed, SearchRecipes } from '@/components/recipes'

export default async function RecipesPage({
	searchParams,
}: {
	searchParams?: Promise<{
		search?: string
		course?: string
		categories?: string
		favourites?: string
		sort?: string
	}>
}) {
	const params = await searchParams
	const searchParam = params?.search
	const courseParam = params?.course
	const categoriesParam = params?.categories
	const favouritesParam = params?.favourites === 'true'
	const sortParam = params?.sort

	return (
		<main className='flex flex-col items-center text-forest-400 w-full h-full'>
			<SearchRecipes />
			<div className='w-10/12 sm:w-2/4 lg:w-2/6'>
				<RecipesFeed
					searchParam={searchParam}
					courseParam={courseParam}
					categoriesParam={categoriesParam}
					favouritesParam={favouritesParam}
					sortParam={sortParam}
				/>
			</div>
		</main>
	)
}
