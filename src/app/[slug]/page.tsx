'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, User, Users } from 'lucide-react';

import { useRecipesStore } from '@/providers/recipes-store-provider';
import { Icon } from '@/components/recipes/icon';
import { IconProps, cn } from '@/utils';

export default function Page() {
	const pathname = usePathname();
	const slug = pathname.split('/')[1];
	const { recipes } = useRecipesStore((state) => state);

	const recipe = recipes.find((recipe) => recipe.slug === slug);

	return (
		<div className='flex flex-col pt-2 my-2 text-center'>
			<Link
				href='/'
				className={cn(
					'flex w-fit p-1 px-3 rounded-[5px] items-center text-neutral-600 text-xs md:text-sm',
					'transition-all duration-300 hover:bg-forest-200/15 group'
				)}>
				<svg
					xmlns='http://www.w3.org/2000/svg'
					width='20'
					height='20'
					viewBox='0 0 24 24'
					fill='none'
					strokeWidth='2.5'
					strokeLinecap='round'
					strokeLinejoin='round'
					className='stroke-current group-hover:stroke-forest-200'>
					<line
						x1='5'
						y1='12'
						x2='19'
						y2='12'
						className='scale-x-0 group-hover:scale-x-100 -translate-x-4 group-hover:-translate-x-1 transition-all duration-300 ease-in-out'
					/>
					<polyline
						points='12 19 5 12 12 5'
						className='translate-x-0 group-hover:-translate-x-1 transition-all duration-300 ease-in-out'
					/>
				</svg>
				All recipes
			</Link>
			{!recipes || !recipe ? (
				<span className='font-bold text-neutral-600'>Recipe not found</span>
			) : (
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
			)}
		</div>
	);
}
