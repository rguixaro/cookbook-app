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
import { createRecipe, uploadRecipeImages } from '@/server/actions'
import { GoBack } from '@/components/layout'
import {
	CategorySelector,
	IngredientSelector,
	SourceLinksInput,
} from '@/components/recipes/form'
import { RecipeImageInput } from '@/components/recipes/form/image-input'
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
	const [images, setImages] = useState<string[]>([])
	const [imageFiles, setImageFiles] = useState<(File | null)[]>([])
	const [coverIndex, setCoverIndex] = useState(0)

	/**
	 * onSubmit form handler
	 * @param values
	 */
	const onSubmit = async (values: z.infer<typeof CreateRecipeSchema>) => {
		try {
			setLoading(true)
			const { error, message, recipeId } = await createRecipe({
				...values,
				sourceUrls: sourceUrls.filter((url) => url.trim() !== ''),
			})
			if (error || !recipeId) {
				toast.error(t_toasts(message || 'error'))
				return
			}

			// Upload images if any
			const newFiles = imageFiles.filter((f): f is File => f !== null)
			if (newFiles.length > 0) {
				const formData = new FormData()
				// Reorder: cover image first
				const ordered = reorderByCover(newFiles, coverIndex)
				ordered.forEach((file) => formData.append('images', file))
				await uploadRecipeImages(recipeId, formData)
			}

			toast.success(t_toasts('recipe-created'))
			form.reset()
			setIngredients([])
			setImages([])
			setImageFiles([])
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
		<div className='flex flex-col items-center pt-2 my-2 text-forest-400 z-0 w-full'>
			<div className='w-11/12 sm:w-3/5 lg:w-3/8'>
				<GoBack text={'recipes'} />
			</div>
			<div className='flex my-5 w-10/12 sm:w-2/4 lg:w-2/6 flex-col border-4 border-forest-200/15 p-4 rounded-3xl text-forest-400'>
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
											className='border-2 text-center py-5 bg-forest-200/15'
											placeholder={t('recipe-name')}
											disabled={loading}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className='my-5'>
							<RecipeImageInput
								images={images}
								onChange={setImages}
								files={imageFiles}
								onFilesChange={setImageFiles}
								coverIndex={coverIndex}
								onCoverChange={setCoverIndex}
								disabled={loading}
							/>
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
										<div className='flex my-5 bg-forest-200/15 rounded-2xl overflow-hidden shadow-sm'>
											<div className='bg-forest-200 p-2 flex items-center justify-center'>
												<Clock color='#fff' size={24} />
											</div>
											<div className='flex px-5 w-full items-center rounded-r-2xl justify-between border-2 border-l-0 border-forest-200/15'>
												<span className='font-bold text-forest-200/75 leading-4'>
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
																		className='rounded border-none shadow-none focus-visible:ring-0 text-right'
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
											className='border-2 bg-forest-200/15 text-forest-400 placeholder:text-forest-200'
											placeholder={t('instructions-add')}
											disabled={loading}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className='my-5'>
							<FormLabel>{t('source-links')}</FormLabel>
							<SourceLinksInput
								values={sourceUrls}
								setValues={setSourceUrls}
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
									<span className='text-base font-bold'>
										{loading ? t('creating') : t('create')}
									</span>
								</div>
							</Button>
						</div>
					</form>
				</Form>
			</div>
		</div>
	)
}

/** Reorder array so the cover image is first */
function reorderByCover<T>(arr: T[], coverIdx: number): T[] {
	if (coverIdx === 0 || coverIdx >= arr.length) return arr
	const copy = [...arr]
	const [cover] = copy.splice(coverIdx, 1)
	copy.unshift(cover)
	return copy
}
