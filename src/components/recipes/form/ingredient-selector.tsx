'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, X } from 'lucide-react';

import { cn } from '@/utils';
import { FormControl, InputGlobalStyles } from '@/ui';

interface IngredientSelectorProps {
	values: string[];
	setValues: (value: string[]) => void;
}

export const IngredientSelector = ({
	values,
	setValues,
}: IngredientSelectorProps) => {
	const t = useTranslations('RecipesPage');
	const [currIngredient, setCurrIngredient] = useState<string>('');

	useEffect(() => {
		if (values.length > 0) setValues(values);
	}, [values]);

	function addIngredient(event?: React.KeyboardEvent<HTMLInputElement>) {
		if (event && event.key !== 'Enter') return;
		if (currIngredient === '') return;
		setValues([...values, currIngredient]);
		setCurrIngredient('');
	}

	return (
		<>
			<FormControl>
				<div className='relative my-2'>
					<button
						type='button'
						className='absolute left-2 top-[6px]'
						onClick={() => addIngredient()}>
						<Plus color={'#789B84'} size={24} />
					</button>
					<input
						value={currIngredient}
						className={cn(InputGlobalStyles, 'rounded-2xl ps-10')}
						placeholder={t('ingredients-add')}
						onChange={(e) => setCurrIngredient(e.currentTarget.value)}
						onKeyDown={addIngredient}
					/>
				</div>
			</FormControl>
			{values.map((ingredient, index) => (
				<div
					key={index}
					className='flex items-center justify-between bg-forest-200/15 rounded-2xl shadow-sm my-2 py-1 px-3'>
					<span className='ms-1'>{ingredient}</span>
					<button
						onClick={() =>
							setValues(values.filter((_, i) => i !== index))
						}>
						<X color={'#789B84'} size={18} />
					</button>
				</div>
			))}
		</>
	);
};
