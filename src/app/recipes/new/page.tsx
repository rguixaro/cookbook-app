'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Clock, ImageIcon, LoaderIcon } from 'lucide-react'
import { toast } from 'sonner'
import { type z } from 'zod'

import {
	CreateRecipeSchema,
	type RecipeCourse,
	type RecipeCategory,
} from '@/server/schemas'
import { createRecipe } from '@/server/actions'
import { GoBack } from '@/components/layout'
import {
	CourseSelector,
	IngredientSelector,
	SourceLinksInput,
	CategorySelector,
} from '@/components/recipes/form'
import {
	parseOptionalIntegerInput,
	preventNonDigitKey,
	preventNonDigitPaste,
} from '@/components/recipes/form/numeric-input'
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
			categories: [],
			time: undefined,
			instructions: '',
			sourceUrls: [],
		},
	})

	const [ingredients, setIngredients] = useState<string[]>([])
	const [categories, setCategories] = useState<RecipeCategory[]>([])
	const [sourceUrls, setSourceUrls] = useState<string[]>([])
	const isSubmitted = form.formState.isSubmitted

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
		form.setValue('ingredients', ingredients as [string, ...string[]], {
			shouldValidate: isSubmitted,
		})
	}, [ingredients, form, isSubmitted])

	useEffect(() => {
		form.setValue('categories', categories, {
			shouldValidate: isSubmitted,
		})
	}, [categories, form, isSubmitted])

	useEffect(() => {
		form.setValue('sourceUrls', sourceUrls, {
			shouldValidate: isSubmitted,
		})
	}, [sourceUrls, form, isSubmitted])

	const handleIngredientInputError = useCallback(
		(message: string | null) => {
			if (message) {
				form.setError('ingredients', {
					type: 'manual',
					message,
				})
				return
			}

			const error = form.getFieldState('ingredients').error
			if (error?.type === 'manual') {
				form.clearErrors('ingredients')
				if (isSubmitted) void form.trigger('ingredients')
			}
		},
		[form, isSubmitted],
	)

	const handleSourceLinkInputError = useCallback(
		(message: string | null) => {
			if (message) {
				form.setError('sourceUrls', {
					type: 'manual',
					message,
				})
				return
			}

			const error = form.getFieldState('sourceUrls').error
			if (error?.type === 'manual') {
				form.clearErrors('sourceUrls')
				if (isSubmitted) void form.trigger('sourceUrls')
			}
		},
		[form, isSubmitted],
	)

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
						className='w-full px-2'>
						<FormField
							control={form.control}
							name='name'
							render={({ field }) => (
								<FormItem className='text-left border-y-8 border-forest-150 bg-forest-150 rounded-t-[20px]'>
									<FormControl>
										<Input
											{...field}
											autoComplete='off'
											className='text-center bg-forest-50 text-forest-200 text-lg md:text-xl font-title font-black leading-4 placeholder:font-normal placeholder:font-sans placeholder:text-forest-200/75 placeholder:text-sm placeholder:leading-normal border-0 rounded-[20px] focus-visible:ring-0 shadow-none h-12.5 px-4'
											placeholder={t(
												'recipe-name-placeholder',
											)}
											disabled={loading}
										/>
									</FormControl>
									<FormMessage className='bg-forest-100 text-center mt-3 mb-0' />
								</FormItem>
							)}
						/>
						<div className='border-y-8 border-forest-150 py-0 bg-forest-150 rounded-[20px]'>
							<div className='bg-forest-100 p-3 mb-4 rounded-[20px] shadow-center-sm'>
								<div className='p-3 flex flex-col items-center justify-center gap-1.5 rounded-xl bg-forest-150 border-2 border-dashed border-forest-200/25'>
									<ImageIcon
										size={24}
										className='text-forest-200'
									/>
									<span className='text-xs text-center text-forest-200'>
										{t('images-after-create')}
									</span>
								</div>
							</div>
							<FormField
								control={form.control}
								name='course'
								render={() => (
									<div className='bg-forest-150 border-b-8 border-forest-150'>
										<FormItem className='bg-forest-100 rounded-[20px] shadow-center-sm pt-3 pb-1'>
											<FormLabel>{t('course')}</FormLabel>
											<FormControl>
												<CourseSelector
													value={form.getValues('course')}
													setValue={(value) =>
														form.setValue(
															'course',
															value as RecipeCourse,
															{
																shouldValidate:
																	form.formState
																		.isSubmitted,
															},
														)
													}
												/>
											</FormControl>
											<FormMessage
												className='mt-0 mb-0'
												parentClassName='pb-3'
											/>
										</FormItem>
									</div>
								)}
							/>
							<FormField
								control={form.control}
								name='categories'
								render={() => (
									<div className='bg-forest-150 border-y-8 border-forest-150'>
										<FormItem className='bg-forest-100 rounded-[20px] shadow-center-sm pt-3 pb-1'>
											<FormLabel>{t('categories')}</FormLabel>
											<FormControl>
												<CategorySelector
													values={categories}
													setValues={setCategories}
													disabled={loading}
												/>
											</FormControl>
											<FormMessage
												className='mt-0 mb-0'
												parentClassName='pb-3'
											/>
										</FormItem>
									</div>
								)}
							/>
							<FormField
								control={form.control}
								name='time'
								render={({ field }) => (
									<div className='bg-forest-150 border-y-8 border-forest-150'>
										<FormItem className='bg-forest-100 rounded-[20px] shadow-center-sm pt-4 pb-4'>
											<div className='flex items-center justify-between gap-3 space-y-0 px-4'>
												<FormLabel className='leading-none'>
													{t('time')}
												</FormLabel>
												<div className='py-2 sm:px-4 md:px-8' />
												<FormControl>
													<div className='inline-flex w-fit max-w-2/3 bg-forest-50 border-2 border-forest-150 rounded-2xl overflow-hidden shadow-center-sm'>
														<div className='flex px-3 py-1 items-center gap-2 text-center'>
															<Input
																{...field}
																value={
																	field.value || ''
																}
																{...form.register(
																	'time',
																	{
																		setValueAs:
																			parseOptionalIntegerInput,
																	},
																)}
																autoComplete='off'
																type='text'
																inputMode='numeric'
																pattern='[0-9]*'
																onKeyDown={
																	preventNonDigitKey
																}
																onPaste={
																	preventNonDigitPaste
																}
																className='text-lg rounded border-none px-0 shadow-none! focus-visible:ring-0 text-right placeholder:text-forest-200/75'
																placeholder='25'
																disabled={loading}
															/>
															<span className='shrink-0 whitespace-nowrap text-sm font-bold text-forest-200'>
																{t('minutes')}
															</span>
														</div>
													</div>
												</FormControl>
											</div>
											<FormMessage className='mt-3 mb-0' />
										</FormItem>
									</div>
								)}
							/>
							<FormField
								control={form.control}
								name='ingredients'
								render={() => (
									<div className='bg-forest-150 border-y-8 border-forest-150'>
										<FormItem className='bg-forest-100 rounded-[20px] shadow-center-sm pt-3 pb-4'>
											<FormLabel>{t('ingredients')}</FormLabel>
											<IngredientSelector
												values={ingredients}
												setValues={setIngredients}
												disabled={loading}
												onInputErrorChange={
													handleIngredientInputError
												}
											/>
										</FormItem>
									</div>
								)}
							/>
							<FormField
								control={form.control}
								name='instructions'
								render={({ field }) => (
									<div className='bg-forest-150 border-y-8 border-forest-150'>
										<FormItem className='bg-forest-100 rounded-[20px] shadow-center-sm pt-3 pb-4'>
											<div className='px-4'>
												<FormLabel>
													{t('instructions')}
												</FormLabel>
												<FormControl>
													<Textarea
														{...field}
														autoResize
														onKeyDown={(e) =>
															e.stopPropagation()
														}
														className='mt-3 border-2 bg-forest-50 text-forest-200 placeholder:text-forest-200/75'
														placeholder={t(
															'instructions-add',
														)}
														disabled={loading}
													/>
												</FormControl>
											</div>
											<FormMessage className='mt-3 mb-0' />
										</FormItem>
									</div>
								)}
							/>
							<FormField
								control={form.control}
								name='sourceUrls'
								render={() => (
									<div className='bg-forest-150 border-y-8 border-forest-150'>
										<FormItem className='bg-forest-100 rounded-[20px] shadow-center-sm pt-3 pb-4'>
											<FormLabel>
												{t('source-links')}
											</FormLabel>
											<SourceLinksInput
												values={sourceUrls}
												setValues={setSourceUrls}
												disabled={loading}
												onInputErrorChange={
													handleSourceLinkInputError
												}
											/>
										</FormItem>
									</div>
								)}
							/>
							<div className='w-full flex justify-center mt-2'>
								<Button
									type='submit'
									className='w-full'
									size={'lg'}
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
