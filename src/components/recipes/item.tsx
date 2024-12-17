import { RecipeSchema } from '@/types';
import { cn } from '@/utils';
import { Icon } from './icon';

export function RecipeItem({ recipe }: { recipe: RecipeSchema }) {
	return (
		<div
			className={cn(
				'w-full my-2 py-2 px-2 flex flex-col items-start',
				'border-2 border-forest-200 rounded-lg',
				'transition-all duration-300 hover:bg-forest-200/15'
			)}>
			<div className='flex items-center justify-between w-full'>
				<div className='flex items-center'>
					<Icon name={recipe.category} />
					<span className='ms-2 text-base md:text-lg text-forest-200 font-bold'>
						{recipe.name}
					</span>
				</div>
				<span className='text-xs md:text-sm font-bold text-neutral-600'>{`${recipe.time}'`}</span>
			</div>
			<div className='text-sm md:text-base mt-2'>
				<span className='font-semibold line-clamp-2 text-neutral-600'>
					{'Instructions: '}
					<span className='font-normal text-justify'>
						{recipe.instructions}
					</span>
				</span>
			</div>
		</div>
	);
}
