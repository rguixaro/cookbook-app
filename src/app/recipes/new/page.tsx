'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Clock, LoaderIcon } from 'lucide-react'
import { toast } from 'sonner'
import { type z } from 'zod'

import { Categories, CreateRecipeSchema } from '@/server/schemas'
import { createRecipe } from '@/server/actions'
import { GoBack } from '@/components/layout'
import { CategorySelector, IngredientSelector } from '@/components/recipes/form'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Textarea,
} from '@/ui'

export default function NewRecipePage() {
	const t = useTranslations('RecipesPage')
	const t_toasts = useTranslations('toasts')
	const router = useRouter()

	const [loading, setLoading] = useState<boolean>(false)

	const form = useForm<z.infer<typeof CreateRecipeSchema>>({
		resolver: zodResolver(CreateRecipeSchema),
		defaultValues: {
			name: '',
			ingredients: [],
			time: undefined,
			instructions: '',
		},
	})

	const [ingredients, setIngredients] = useState<string[]>([])

	/**
	 * onSubmit form handler
	 * @param values
	 */
	const onSubmit = async (values: z.infer<typeof CreateRecipeSchema>) => {
		try {
			setLoading(true)
			const { error, message } = await createRecipe(values)
			if (error) {
				/* @ts-expect-error: Unnecessary message type */
				toast.error(t_toasts(message || 'error'))
				return
			}

			toast.success(t_toasts('recipe-created'))
			form.reset()
			setIngredients([])
			router.replace('/')
		} catch (error) {
			toast.error(t_toasts('error'))
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (ingredients.length > 0)
			form.setValue('ingredients', ingredients as [string, ...string[]])
	}, [ingredients, form])

	function checkKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
		if (event.key === 'Enter') event.preventDefault()
	}

	return (
		<div className='flex flex-col pt-2 my-2 text-forest-400 w-full z-0'>
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
										className='rounded border-2 text-center py-5 bg-forest-200/15'
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
									<div className='flex my-5 bg-forest-200/15 rounded overflow-hidden shadow-sm'>
										<div className='bg-forest-200 p-2 flex items-center justify-center'>
											<Clock color='#fff' size={24} />
										</div>
										<div className='flex px-5 w-full items-center rounded-r justify-between border-2 border-forest-200/15'>
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
																	className='rounded border-none shadow-none focus-visible:ring-0 text-right'
																	placeholder={t(
																		'minutes'
																	)}
																	disabled={
																		loading
																	}
																/>
															</FormControl>
														</FormItem>
													)
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
										className='rounded border-2 bg-forest-200/15 text-forest-400 placeholder:text-forest-200'
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
							className='bg-forest-200 p-2 px-5 rounded shadow text-white'>
							<div className='flex items-center space-x-3'>
								{loading && (
									<LoaderIcon size={16} className='animate-spin' />
								)}
								<span className='text-base md:text-lg font-bold'>
									{loading ? t('creating') : t('create')}
								</span>
							</div>
						</button>
					</div>
				</form>
			</Form>
		</div>
	)
}
