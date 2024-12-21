import { getRecipesByUser } from '@/server/queries';
import { ItemRecipe } from '@/components/recipes/item';
import { Info } from '@/components/recipes/info';

export const RecipesFeed = async ({ searchParam }: { searchParam?: string }) => {
	const data = await getRecipesByUser();

	const filteredRecipes = data?.recipes.filter((recipe) => {
		if (!searchParam) return true;
		const matchRecipe = !searchParam || recipe.name.includes(searchParam);
		return matchRecipe;
	});

	const sortedRecipes = filteredRecipes?.sort((a, b) => {
		return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
	});

	return (
		<div className='w-full h-full flex flex-col items-center'>
			{sortedRecipes?.map((recipe) => (
				<ItemRecipe key={recipe.id} recipe={recipe} />
			))}
			<Info enabled={filteredRecipes?.length === 0} />
		</div>
	);
};
