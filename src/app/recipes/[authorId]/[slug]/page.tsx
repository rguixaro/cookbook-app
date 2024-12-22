import { getTranslations } from 'next-intl/server';
import { Clock, Utensils } from 'lucide-react';

import { auth } from '@/auth';
import { getRecipeByAuthAndSlug } from '@/server/queries';
import { GoBack } from '@/components/layout/go-back';
import { Icon } from '@/components/recipes/icon';
import { SavedStatus } from '@/components/recipes/saved';
import { IconProps, cn } from '@/utils';
import { TypographyH4 } from '@/ui';

export default async function RecipePage({
	params,
	searchParams,
}: {
	params: Promise<{ authorId: string; slug: string }>;
	searchParams?: Promise<{ referred?: boolean }>;
}) {
	const session = await auth();
	const { slug, authorId } = await params;
	const isReferred = (await searchParams)?.referred;

	const recipe = await getRecipeByAuthAndSlug(authorId, slug);
	const t = await getTranslations('RecipesPage');

	const isOwner = session?.user?.id === recipe?.authorId;
	const isSaved = session?.user?.savedRecipes.includes(recipe?.id as string);

	return (
		<div className='flex flex-col pt-2 my-2 text-center'>
			<GoBack text={'recipes'} to={isReferred ? `/profile/${authorId}` : '/'}>
				{!isOwner && (
					<SavedStatus initial={isSaved} recipeId={recipe?.id as string} />
				)}
			</GoBack>
			{!recipe ? (
				<div className='h-32 mt-10 flex flex-col items-center justify-center text-forest-200'>
					<TypographyH4>{t('not-found')}</TypographyH4>
					<Utensils size={24} className='mt-2 mb-5' />
				</div>
			) : (
				<div
					className={cn(
						'w-full mb-2 py-2 px-2 flex flex-col items-center justify-center '
					)}>
					<div className='flex items-center justify-center w-full'>
						<div className='flex items-center space-x-2'>
							<span className='text-base md:text-lg text-forest-200 font-bold'>
								{recipe.name}
							</span>
							<Icon name={recipe.category} />
						</div>
					</div>
					<div className='flex items-center justify-center w-full mt-2'>
						<Clock {...IconProps} />
						<span className='text-xs md:text-sm font-bold text-neutral-600 ms-2 mr-5'>{`${recipe.time}'`}</span>
					</div>
					<div className='text-sm md:text-base mt-5'>
						<p className='font-semibold text-forest-200'>
							{t('ingredients')}
						</p>
						<span className='font-normal'>
							{recipe.ingredients.map((ingredient, index) => (
								<div key={index} className='font-normal'>
									{ingredient}
								</div>
							))}
						</span>
					</div>
					<div className='text-sm md:text-base mt-5'>
						<p className='font-semibold text-forest-200'>
							{t('instructions')}
						</p>
						<span className='font-normal text-justify'>
							{recipe.instructions}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
