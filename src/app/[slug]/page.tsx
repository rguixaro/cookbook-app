'use client';

import { usePathname } from 'next/navigation';
import { Clock, User, Users } from 'lucide-react';

import { useRecipesStore } from '@/providers/recipes-store-provider';
import { Icon } from '@/components/recipes/icon';
import { cn } from '@/utils';

const IconProps = { color: '#525252', size: 18 };

export default function Page() {
	const pathname = usePathname();
	const slug = pathname.split('/')[1];
	const { recipes } = useRecipesStore((state) => state);

	const recipe = recipes.find((recipe) => recipe.slug === slug);
	if (!recipes || !recipe) return <div>Recipe not found</div>;

	return (
		<div className='flex flex-col pt-5 text-center'>
			<div
				className={cn(
					'w-full my-2 py-2 px-2 flex flex-col  items-center justify-center '
				)}>
				<div className='flex items-center justify-center w-full'>
					<div className='flex items-center'>
						<Icon name={recipe.category} />
						<span className='ms-2 text-base md:text-lg text-forest-200 font-bold'>
							{recipe.name}
						</span>
					</div>
				</div>
				<div className='flex items-center justify-center w-full mt-2'>
					<Clock {...IconProps} />
					<span className='text-xs md:text-sm font-bold text-neutral-600 ms-2 mr-5'>{`${recipe.time}'`}</span>

					{recipe.rations === 1 ? (
						<User {...IconProps} />
					) : (
						<Users {...IconProps} />
					)}
					<span className='text-xs md:text-sm font-bold text-neutral-600 ms-2'>{`${recipe.rations}`}</span>
				</div>

				<div className='text-sm md:text-base mt-5'>
					<p className='font-semibold text-forest-200'>
						{'Ingredients: '}
					</p>
					<span className='font-normal text-justify'>
						{recipe.ingredients.map((ingredient, index) => (
							<div key={index} className='flex items-center'>
								<span className='font-normal'>{`${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`}</span>
							</div>
						))}
					</span>
				</div>
				<div className='text-sm md:text-base mt-5'>
					<p className='font-semibold text-forest-200'>
						{'Instructions: '}
					</p>
					<span className='font-normal text-justify'>
						{recipe.instructions}
					</span>
				</div>
			</div>
		</div>
	);
}
