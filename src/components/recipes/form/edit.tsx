'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderIcon } from 'lucide-react'
import { toast } from 'sonner'
import { type z } from 'zod'
import * as Sentry from '@sentry/nextjs'

import {
	CreateRecipeSchema,
	type RecipeCourse,
	type RecipeCategory,
} from '@/server/schemas'
import {
	deleteRecipe,
	updateRecipe,
	uploadRecipeImages,
	updateRecipeImages,
} from '@/server/actions'
import { GoBack } from '@/components/layout'
import {
	CourseSelector,
	IngredientSelector,
	SourceLinksInput,
	CategorySelector,
} from '@/components/recipes/form'
import { RecipeImageInput } from '@/components/recipes/form/image-input'
import {
	parseOptionalIntegerInput,
	preventNonDigitKey,
	preventNonDigitPaste,
} from '@/components/recipes/form/numeric-input'
import {
	Button,
	buttonVariants,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
import { cn } from '@/utils'

interface EditRecipeProps {
	recipe: Recipe
}

type RecipeFormInput = z.input<typeof CreateRecipeSchema>
type RecipeFormOutput = z.output<typeof CreateRecipeSchema>

const CLOUDFRONT_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN ?? ''

/**
 * Extract the S3 file key from a full CloudFront URL.
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
	const [deleting, setDeleting] = useState<boolean>(false)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
	const [deleteConfirmation, setDeleteConfirmation] = useState<string>('')

	const form = useForm<RecipeFormInput, unknown, RecipeFormOutput>({
		resolver: zodResolver(CreateRecipeSchema),
		defaultValues: {
			name: props.recipe.name,
			ingredients: props.recipe.ingredients,
			time: undefined,
			instructions: props.recipe.instructions,
			course: props.recipe.course as RecipeCourse,
			categories: props.recipe.categories ?? [],
			sourceUrls: props.recipe.sourceUrls ?? [],
		},
	})

	const [ingredients, setIngredients] = useState<string[]>(
		form.getValues('ingredients') || [],
	)
	const [categories, setCategories] = useState<RecipeCategory[]>(
		props.recipe.categories ?? [],
	)
	const [sourceUrls, setSourceUrls] = useState<string[]>(
		props.recipe.sourceUrls ?? [],
	)
	const isSubmitted = form.formState.isSubmitted

	const existingUrls = props.recipe.images ?? []
	const [images, setImages] = useState<string[]>(existingUrls)
	const [imageFiles, setImageFiles] = useState<(File | null)[]>(
		existingUrls.map(() => null),
	)
	const [coverIndex, setCoverIndex] = useState(0)
	const deleteConfirmationWord = t('delete-confirmation-word')
	const deleteConfirmed =
		deleteConfirmation.trim().toLowerCase() ===
		deleteConfirmationWord.toLowerCase()

	/**
	 * onSubmit form handler
	 * @param values
	 */
	const onSubmit = async (values: RecipeFormOutput) => {
		try {
			setLoading(true)
			const { error, message, recipePath } = await updateRecipe(
				props.recipe.id,
				{
					...values,
					sourceUrls: sourceUrls.filter((url) => url.trim() !== ''),
				},
			)
			if (error || !recipePath) {
				toast.error(t_toasts(message || 'error'))
				return
			}

			const orderedImages = reorderByCover(images, coverIndex)
			const orderedFiles = reorderByCover(imageFiles, coverIndex)

			const newFiles: { file: File; position: number }[] = []
			orderedFiles.forEach((file, i) => {
				if (file !== null) {
					const freshFile = dataURItoFile(
						orderedImages[i],
						`image-${i}.jpg`,
					)
					newFiles.push({ file: freshFile, position: i })
				}
			})

			let uploadedKeys: string[] = []
			if (newFiles.length > 0) {
				const formData = new FormData()
				newFiles.forEach(({ file }) => formData.append('images', file))
				const result = await uploadRecipeImages(props.recipe.id, formData)
				if (result.error) {
					toast.error(t_toasts('error'))
					return
				}
				uploadedKeys = result.images?.slice(-newFiles.length) ?? []
			}

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

			const imgResult = await updateRecipeImages(props.recipe.id, finalKeys)
			if (imgResult.error) {
				toast.error(t_toasts('error'))
				return
			}

			toast.success(t_toasts('recipe-updated'))
			router.replace(recipePath)
			router.refresh()
		} catch (error) {
			Sentry.captureException(error, { tags: { component: 'EditRecipe' } })

			const message =
				error instanceof Error &&
				error.message.includes('unexpected response')
					? 'error-file-too-large'
					: 'error'
			toast.error(t_toasts(message))
		} finally {
			setLoading(false)
		}
	}

	const handleDeleteRecipe = async () => {
		if (!deleteConfirmed) return

		try {
			setDeleting(true)
			const { error } = await deleteRecipe(props.recipe.id)
			if (error) {
				toast.error(t_toasts('error'))
				return
			}

			toast.success(t_toasts('recipe-deleted'))
			router.replace('/')
			router.refresh()
		} catch (error) {
			Sentry.captureException(error, {
				tags: { component: 'EditRecipe', action: 'deleteRecipe' },
			})
			toast.error(t_toasts('error'))
		} finally {
			setDeleting(false)
		}
	}

	useEffect(() => {
		if (props.recipe.time) form.setValue('time', props.recipe.time)
	}, [props.recipe.time, form])

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
				<GoBack
					to={`/recipes/${props.recipe.authorUsername}/${props.recipe.slug}`}
				/>
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
											disabled={loading || deleting}
										/>
									</FormControl>
									<FormMessage className='bg-forest-100 text-center mt-3 mb-0' />
								</FormItem>
							)}
						/>
						<div className='border-y-8 border-forest-150 py-0 bg-forest-150 rounded-[20px]'>
							<div className='bg-forest-100 p-4 mb-4 rounded-[20px] shadow-center-sm'>
								<RecipeImageInput
									images={images}
									onChange={setImages}
									files={imageFiles}
									onFilesChange={setImageFiles}
									coverIndex={coverIndex}
									onCoverChange={setCoverIndex}
									disabled={loading || deleting}
								/>
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
													disabled={loading || deleting}
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
													disabled={loading || deleting}
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
											<div className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-3 space-y-0 px-4'>
												<FormLabel className='min-w-0 text-left leading-none'>
													{t('time')}
												</FormLabel>
												<FormControl>
													<div className='shrink-0 bg-forest-50 border-2 border-forest-150 rounded-2xl overflow-hidden shadow-center-sm'>
														<div className='flex flex-col px-3 sm:px-5 py-1 items-center text-center'>
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
																className='h-auto w-[4ch] min-w-0 py-0 text-base font-bold rounded border-none px-0 shadow-none! focus-visible:ring-0 text-center placeholder:text-forest-200/75'
																placeholder='25'
																disabled={
																	loading ||
																	deleting
																}
															/>
															<span className='w-full whitespace-nowrap text-xs text-left text-forest-200'>
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
												disabled={loading || deleting}
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
														disabled={
															loading || deleting
														}
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
												disabled={loading || deleting}
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
									disabled={loading || deleting}
									className='w-full'
									size={'lg'}>
									<div className='flex items-center space-x-3'>
										{loading && (
											<LoaderIcon
												size={16}
												className='animate-spin'
											/>
										)}
										{!loading && (
											<span className='text-base font-bold text-forest-50'>
												{t('update')}
											</span>
										)}
									</div>
								</Button>
							</div>
						</div>
					</form>
				</Form>
			</div>
			<div className='-mt-2 mb-4 flex w-10/12 justify-center sm:w-2/4 lg:w-2/6'>
				<Dialog
					open={deleteDialogOpen}
					onOpenChange={(open) => {
						setDeleteDialogOpen(open)
						if (!open) setDeleteConfirmation('')
					}}>
					<DialogTrigger
						type='button'
						disabled={loading || deleting}
						className={cn(
							buttonVariants({ variant: 'ghost' }),
							'h-auto px-2 py-1 text-xs font-semibold text-forest-400 hover:bg-transparent hover:text-forest-500',
						)}>
						{t('delete-recipe')}
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>{t('delete-recipe-title')}</DialogTitle>
							<DialogDescription className='flex flex-col space-y-2'>
								<span className='font-semibold text-forest-400'>
									{t('delete-recipe-attention')}
								</span>
								<span>{t('delete-recipe-text')}</span>
							</DialogDescription>
						</DialogHeader>
						<div className='flex flex-col space-y-3 text-forest-400'>
							<p className='text-sm'>
								{t('delete-recipe-prompt')}{' '}
								<span className='font-semibold'>
									{deleteConfirmationWord}
								</span>
							</p>
							<Input
								value={deleteConfirmation}
								onChange={(event) =>
									setDeleteConfirmation(event.target.value)
								}
								placeholder={deleteConfirmationWord}
								disabled={deleting}
								className='my-2 rounded-2xl border-2 bg-forest-50 py-5'
							/>
							<DialogFooter className='mt-3'>
								<DialogClose
									type='button'
									disabled={deleting}
									className={cn(
										buttonVariants({ variant: 'ghost' }),
										'font-bold text-forest-400',
									)}>
									{t('cancel')}
								</DialogClose>
								<Button
									type='button'
									variant='destructive'
									disabled={deleting || !deleteConfirmed}
									onClick={handleDeleteRecipe}
									className='flex items-center justify-center gap-3 bg-forest-500 hover:bg-forest-600'>
									<span className='flex items-center justify-center gap-3'>
										{deleting && (
											<>
												<LoaderIcon
													size={16}
													className='animate-spin'
												/>
												<span className='font-bold text-forest-50'>
													{t('deleting')}
												</span>
											</>
										)}
										{!deleting && (
											<span className='font-bold text-forest-50'>
												{t('delete')}
											</span>
										)}
									</span>
								</Button>
							</DialogFooter>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	)
}

/**
 * Convert a base64 data URI to a File object.
 * Used to create fresh Files at submission time, avoiding stale blob
 * references that mobile browsers can invalidate after clearing the
 * file input.
 */
function dataURItoFile(dataURI: string, filename: string): File {
	const [header, data] = dataURI.split(',')
	const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
	const binary = atob(data)
	const bytes = new Uint8Array(binary.length)
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
	return new File([bytes], filename, { type: mime })
}

/** Reorder array so the cover image is first */
function reorderByCover<T>(arr: T[], coverIdx: number): T[] {
	if (coverIdx === 0 || coverIdx >= arr.length) return arr
	const copy = [...arr]
	const [cover] = copy.splice(coverIdx, 1)
	copy.unshift(cover)
	return copy
}
