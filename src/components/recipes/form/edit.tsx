'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, LoaderIcon } from 'lucide-react';
import { toast } from 'sonner';
import { type z } from 'zod';

import { Categories, CreateRecipeSchema } from '@/server/schemas';
import { updateRecipe } from '@/server/actions';
import { GoBack } from '@/components/layout/go-back';
import { CategorySelector, IngredientSelector } from '@/components/recipes/form';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Textarea,
} from '@/ui';
import { Recipe } from '@/types';

interface EditRecipeProps {
	userId: string;
	recipe: Recipe;
}

export const EditRecipe = (props: EditRecipeProps) => {
	const t = useTranslations('RecipesPage');
	const t_toasts = useTranslations('toasts');
	const router = useRouter();

	const [loading, setLoading] = useState<boolean>(false);

	const form = useForm<z.infer<typeof CreateRecipeSchema>>({
		resolver: zodResolver(CreateRecipeSchema),
		defaultValues: {
			name: props.recipe.name,
			ingredients: props.recipe.ingredients,
			time: undefined,
			instructions: props.recipe.instructions,
			category: props.recipe.category as Categories,
		},
	});

	const [ingredients, setIngredients] = useState<string[]>(
		form.getValues('ingredients') || []
	);

	/**
	 * onSubmit form handler
	 * @param values
	 */
	const onSubmit = async (values: z.infer<typeof CreateRecipeSchema>) => {
		try {
			setLoading(true);
			const { error, message } = await updateRecipe(
				props.recipe.id,
				props.userId,
				values
			);
			if (error) {
				/* @ts-expect-error: Unnecessary message type */
				toast.error(t_toasts(message || 'error'));
				return;
			}

			toast.success(t_toasts('recipe-updated'));
			form.reset();
			setIngredients([]);
			router.replace('/');
		} catch (error) {
			toast.error(t_toasts('error'));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (props.recipe.time) form.setValue('time', props.recipe.time);
	}, [props.recipe.time]);

	useEffect(() => {
		if (ingredients.length > 0)
			form.setValue('ingredients', ingredients as [string, ...string[]]);
	}, [ingredients, form]);

	function checkKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
		if (event.key === 'Enter') event.preventDefault();
	}

	return (
		<div className='flex flex-col pt-2 my-2 text-neutral-700 w-full z-0'>
			<GoBack text={'recipes'} />
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					onKeyDown={(e) => checkKeyDown(e)}
					className='w-full mt-2'>
					<FormField
						control={form.control}
						name='name'
						render={({ field }) => (
							<FormItem className='text-left mb-2'>
								<FormControl>
									<Input
										{...field}
										autoComplete='off'
										className='rounded-2xl border-2 text-center py-5 bg-forest-200/15'
										placeholder={t('recipe-name')}
										disabled={loading}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='category'
						render={() => (
							<FormItem className='my-5'>
								<FormLabel>{t('categories')}</FormLabel>
								<FormControl>
									<CategorySelector
										value={form.getValues('category')}
										setValue={(value) =>
											form.setValue(
												'category',
												value as Categories
											)
										}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='time'
						render={() => (
							<FormItem className='my-5'>
								<FormControl>
									<div className='flex my-5 bg-forest-200/15 rounded-2xl overflow-hidden shadow-sm'>
										<div className='bg-forest-200 p-2 flex items-center justify-center'>
											<Clock color='#fff' size={24} />
										</div>
										<div className='flex px-5 w-full items-center rounded-r-2xl justify-between border-2 border-forest-200/15'>
											<span className='font-semibold text-forest-200/75'>
												{t('time')}
											</span>
											<FormField
												control={form.control}
												name='time'
												render={({ field }) => {
													return (
														<FormItem className='my-2'>
															<FormControl>
																<Input
																	{...field}
																	value={
																		field.value ||
																		''
																	}
																	{...form.register(
																		'time',
																		{
																			setValueAs:
																				(
																					v
																				) =>
																					v ===
																					''
																						? undefined
																						: parseInt(
																								v,
																								10
																							),
																		}
																	)}
																	autoComplete='off'
																	type='number'
																	className='rounded-2xl border-none shadow-none focus-visible:ring-0 text-right'
																	placeholder={t(
																		'minutes'
																	)}
																	disabled={
																		loading
																	}
																/>
															</FormControl>
														</FormItem>
													);
												}}
											/>
										</div>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='ingredients'
						render={() => (
							<FormItem className='my-5'>
								<FormLabel>{t('ingredients')}</FormLabel>
								<IngredientSelector
									values={ingredients}
									setValues={setIngredients}
								/>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='instructions'
						render={({ field }) => (
							<FormItem className='my-5'>
								<FormLabel>{t('instructions')}</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										onKeyDown={(e) => e.stopPropagation()}
										className='rounded-2xl border-2 bg-forest-200/15'
										placeholder={t('instructions-add')}
										disabled={loading}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className='w-full flex justify-center mt-5'>
						<button
							type='submit'
							disabled={loading}
							className='bg-forest-200 p-2 px-5 rounded-2xl shadow text-white'>
							<div className='flex items-center space-x-3'>
								{loading && (
									<LoaderIcon size={16} className='animate-spin' />
								)}
								<span className='text-base md:text-lg font-bold'>
									{loading ? t('updating') : t('update')}
								</span>
							</div>
						</button>
					</div>
				</form>
			</Form>
		</div>
	);
};
