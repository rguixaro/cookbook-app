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
import {
	updateRecipe,
	uploadRecipeImages,
	updateRecipeImages,
} from '@/server/actions'
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
import { Recipe } from '@/types'

interface EditRecipeProps {
	recipe: Recipe
}

const CLOUDFRONT_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN ?? ''

/**
 * Extract the S3 file key from a full CloudFront URL.
 * e.g. "https://assets.rguixaro.dev/cookbook/images/recipe_abc/uuid.jpg" → "images/recipe_abc/uuid.jpg"
 */
function extractKey(url: string): string | null {
	if (!CLOUDFRONT_DOMAIN) return null
	return url.startsWith(CLOUDFRONT_DOMAIN)
		? url.slice(CLOUDFRONT_DOMAIN.length + 1)
		: null
}

export const EditRecipe = (props: EditRecipeProps) => {
	const t = useTranslations('RecipesPage')
	const t_toasts = useTranslations('toasts')
	const router = useRouter()

	const [loading, setLoading] = useState<boolean>(false)

	const form = useForm<z.infer<typeof CreateRecipeSchema>>({
		resolver: zodResolver(CreateRecipeSchema),
		defaultValues: {
			name: props.recipe.name,
			ingredients: props.recipe.ingredients,
			time: undefined,
			instructions: props.recipe.instructions,
			category: props.recipe.category as Categories,
			sourceUrls: props.recipe.sourceUrls ?? [],
		},
	})

	const [ingredients, setIngredients] = useState<string[]>(
		form.getValues('ingredients') || [],
	)
	const [sourceUrls, setSourceUrls] = useState<string[]>(
		props.recipe.sourceUrls ?? [],
	)

	// Existing images are already full CloudFront URLs from the query layer
	const existingUrls = props.recipe.images ?? []
	const [images, setImages] = useState<string[]>(existingUrls)
	const [imageFiles, setImageFiles] = useState<(File | null)[]>(
		existingUrls.map(() => null), // null = already uploaded
	)
	const [coverIndex, setCoverIndex] = useState(0)

	/**
	 * onSubmit form handler
	 * @param values
	 */
	const onSubmit = async (values: z.infer<typeof CreateRecipeSchema>) => {
		try {
			setLoading(true)
			const { error, message } = await updateRecipe(props.recipe.id, {
				...values,
				sourceUrls: sourceUrls.filter((url) => url.trim() !== ''),
			})
			if (error) {
				toast.error(t_toasts(message || 'error'))
				return
			}

			// Reorder by cover so index 0 = hero/thumbnail
			const orderedImages = reorderByCover(images, coverIndex)
			const orderedFiles = reorderByCover(imageFiles, coverIndex)

			// Upload new files first so we have their S3 keys
			const newFiles: { file: File; position: number }[] = []
			orderedFiles.forEach((file, i) => {
				if (file !== null) newFiles.push({ file, position: i })
			})

			let uploadedKeys: string[] = []
			if (newFiles.length > 0) {
				// First, clear existing images to make room, then re-set everything
				const formData = new FormData()
				newFiles.forEach(({ file }) => formData.append('images', file))
				const result = await uploadRecipeImages(props.recipe.id, formData)
				uploadedKeys = result.images?.slice(-newFiles.length) ?? []
			}

			// Build final ordered array: existing keys in order + new keys spliced in
			let uploadIdx = 0
			const finalKeys: string[] = orderedFiles
				.map((file, i) => {
					if (file === null) {
						return extractKey(orderedImages[i]) ?? ''
					} else {
						return uploadedKeys[uploadIdx++] ?? ''
					}
				})
				.filter(Boolean)

			// Set the final ordered array
			await updateRecipeImages(props.recipe.id, finalKeys)

			toast.success(t_toasts('recipe-updated'))
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
		if (props.recipe.time) form.setValue('time', props.recipe.time)
	}, [props.recipe.time, form])

	useEffect(() => {
		if (ingredients.length > 0)
			form.setValue('ingredients', ingredients as [string, ...string[]])
	}, [ingredients, form])

	function checkKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
		if (event.key === 'Enter') event.preventDefault()
	}

	return (
		<div className='flex flex-col items-center pt-2 my-2 text-forest-400 w-full z-0'>
			<div className='w-11/12 sm:w-3/5 lg:w-3/8'>
				<GoBack
					to={`/recipes/${props.recipe.authorUsername}/${props.recipe.slug}`}
				/>
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
											className='border-2 bg-forest-200/15'
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
								disabled={loading}
								className='w-full'>
								<div className='flex items-center space-x-3'>
									{loading && (
										<LoaderIcon
											size={16}
											className='animate-spin'
										/>
									)}
									<span className='text-base font-bold'>
										{loading ? t('updating') : t('update')}
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
