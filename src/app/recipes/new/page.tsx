'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Clock, ImageIcon, LoaderIcon } from 'lucide-react'
import { toast } from 'sonner'
import { type z } from 'zod'

import { Categories, CreateRecipeSchema } from '@/server/schemas'
import { createRecipe } from '@/server/actions'
import { GoBack } from '@/components/layout'
import {
	CategorySelector,
	IngredientSelector,
	SourceLinksInput,
} from '@/components/recipes/form'
import {
	Button,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Textarea,
} from '@/ui'
import { cn } from '@/utils'

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
			sourceUrls: [],
		},
	})

	const [ingredients, setIngredients] = useState<string[]>([])
	const [sourceUrls, setSourceUrls] = useState<string[]>([])

	/**
	 * onSubmit form handler
	 * @param values
	 */
	const onSubmit = async (values: z.infer<typeof CreateRecipeSchema>) => {
		try {
			setLoading(true)
			const { error, message, recipeId, recipePath } = await createRecipe({
				...values,
				sourceUrls: sourceUrls.filter((url) => url.trim() !== ''),
			})
			if (error || !recipeId || !recipePath) {
				toast.error(t_toasts(message || 'error'))
				return
			}

			toast.success(t_toasts('recipe-created'))
			router.replace(recipePath)
			router.refresh()
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
		<div className='flex flex-col items-center pt-2 my-2 text-center w-full z-0'>
			<div className='w-11/12 sm:w-3/5 lg:w-3/8'>
				<GoBack text={'recipes'} />
			</div>
			<div
				className={cn(
					'flex my-5 w-10/12 sm:w-2/4 lg:w-2/6',
					'flex-col rounded-3xl shadow-center-sm',
					'bg-forest-150 border-8 border-forest-150 text-forest-400',
				)}>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						onKeyDown={(e) => checkKeyDown(e)}
						className='w-full'>
						<FormField
							control={form.control}
							name='name'
							render={({ field }) => (
								<FormItem className='text-left border-b-8 border-forest-150 bg-forest-150 rounded-t-[20px]'>
									<FormControl>
										<Input
											{...field}
											autoComplete='off'
											className='text-center bg-forest-50 text-forest-300 text-lg md:text-xl font-title font-black leading-4 placeholder:font-normal placeholder:font-sans placeholder:text-forest-200 placeholder:text-sm placeholder:leading-normal border-0 rounded-[20px] focus-visible:ring-0 shadow-none h-12.5 px-4'
											placeholder={t('recipe-name')}
											disabled={loading}
										/>
									</FormControl>
									<FormMessage className='text-center' />
								</FormItem>
							)}
						/>
						<div className='p-4 bg-forest-100 rounded-[20px]'>
							<div className='mb-5 flex flex-col items-center justify-center gap-1.5 py-6 px-3 rounded-xl bg-forest-150 border-2 border-dashed border-forest-200/25'>
								<ImageIcon size={24} className='text-forest-200' />
								<span className='text-xs text-center text-forest-200'>
									{t('images-after-create')}
								</span>
							</div>
							<div className='w-full flex justify-center my-3'>
								<div className='h-2 w-3/4 rounded bg-forest-150' />
							</div>
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
														value as Categories,
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
											<div className='flex my-5 bg-forest-50 rounded-2xl overflow-hidden shadow-center-sm'>
												<div className='bg-forest-200 p-2 flex items-center justify-center border-2 rounded-2xl rounded-r-none border-r-0 border-forest-150'>
													<Clock
														className='stroke-forest-50'
														size={24}
													/>
												</div>
												<div className='flex px-5 w-full items-center rounded-r-2xl justify-between border-2 border-l-0 border-forest-150'>
													<span className='font-bold text-forest-300 leading-4'>
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
																							v,
																						) =>
																							v ===
																							''
																								? undefined
																								: parseInt(
																										v,
																										10,
																									),
																				},
																			)}
																			autoComplete='off'
																			type='number'
																			className='rounded border-none shadow-none! focus-visible:ring-0 text-right'
																			placeholder={t(
																				'minutes',
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
							<div className='w-full flex justify-center my-3'>
								<div className='h-2 w-3/4 rounded bg-forest-150' />
							</div>
							<FormField
								control={form.control}
								name='ingredients'
								render={() => (
									<FormItem className='my-5'>
										<FormLabel>{t('ingredients')}</FormLabel>
										<IngredientSelector
											values={ingredients}
											setValues={setIngredients}
											disabled={loading}
										/>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className='w-full flex justify-center my-3'>
								<div className='h-2 w-3/4 rounded bg-forest-150' />
							</div>
							<FormField
								control={form.control}
								name='instructions'
								render={({ field }) => (
									<FormItem className='my-5'>
										<FormLabel>{t('instructions')}</FormLabel>
										<FormControl className='my-2'>
											<Textarea
												{...field}
												autoResize
												onKeyDown={(e) =>
													e.stopPropagation()
												}
												className='border-2 bg-forest-50 text-forest-200 placeholder:text-forest-200'
												placeholder={t('instructions-add')}
												disabled={loading}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className='w-full flex justify-center my-3'>
								<div className='h-2 w-3/4 rounded bg-forest-150' />
							</div>
							<div className='my-5'>
								<FormLabel>{t('source-links')}</FormLabel>
								<SourceLinksInput
									values={sourceUrls}
									setValues={setSourceUrls}
									disabled={loading}
								/>
							</div>
							<div className='w-full flex justify-center mt-5'>
								<Button
									type='submit'
									className='w-full'
									disabled={loading}>
									<div className='flex items-center space-x-3'>
										{loading && (
											<LoaderIcon
												size={16}
												className='animate-spin'
											/>
										)}
										{!loading && (
											<span className='text-base font-bold text-forest-50'>
												{t('create')}
											</span>
										)}
									</div>
								</Button>
							</div>
						</div>
					</form>
				</Form>
			</div>
		</div>
	)
}
