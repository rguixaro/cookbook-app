'use client'

import { useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ArrowDownToLine, Clock4, ExternalLink } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'
import { toPng } from 'html-to-image'
import { toast } from 'sonner'

import { Icon } from '@/components/recipes/icon'

import { cn, SITE_URL } from '@/utils'
import { RecipeComplementTypes, type RecipeComplement } from '@/types'

type DownloadableRecipe = {
	slug: string
	name: string
	course: string
	categories: string[]
	time: number | null
	ingredients: string[]
	complements: RecipeComplement[]
	instructions: string
	images?: string[]
	sourceUrls?: string[]
}

export const RecipeDownload = ({
	recipe,
	author,
}: {
	recipe: DownloadableRecipe | null
	author: {
		name: string
		image: string
	}
}) => {
	const t = useTranslations('RecipesPage')
	const t_courses = useTranslations('RecipeCourses')
	const t_categories = useTranslations('RecipeCategories')
	const t_toasts = useTranslations('toasts')
	const ref = useRef<HTMLDivElement>(null)

	const onButtonClick = useCallback(async () => {
		if (ref.current === null || !recipe) return

		try {
			const fonts = [
				{ url: '/fonts/montserrat-regular.ttf', weight: '400' },
				{ url: '/fonts/montserrat-medium.ttf', weight: '500' },
				{ url: '/fonts/montserrat-semibold.ttf', weight: '600' },
				{ url: '/fonts/montserrat-bold.ttf', weight: '700' },
				{ url: '/fonts/montserrat-extrabold.ttf', weight: '800' },
				{
					url: '/fonts/guavine-regular.otf',
					weight: '400',
					family: 'Guavine',
				},
			]

			const fontFaces = await Promise.all(
				fonts.map(async (f) => {
					const res = await fetch(f.url)
					const buf = await res.arrayBuffer()
					const bytes = new Uint8Array(buf)
					let binary = ''
					for (let i = 0; i < bytes.length; i++) {
						binary += String.fromCharCode(bytes[i])
					}
					const base64 = btoa(binary)
					const format = f.url.endsWith('.otf') ? 'opentype' : 'truetype'
					return `@font-face { font-family: '${f.family || 'Montserrat'}'; src: url(data:font/${format};base64,${base64}) format('${format}'); font-weight: ${f.weight}; }`
				}),
			)

			const dataUrl = await toPng(ref.current, {
				cacheBust: true,
				backgroundColor: '#fefff2',
				quality: 1,
				skipFonts: true,
				fontEmbedCSS: fontFaces.join('\n'),
			})

			const link = document.createElement('a')
			link.download = `${recipe.slug}.png`
			link.href = dataUrl
			link.click()
		} catch (error) {
			Sentry.captureException(error, { tags: { component: 'RecipeDownload' } })
			toast.error(t_toasts('error'))
		}
	}, [ref, recipe, t_toasts])

	if (!recipe) return null
	const complements = RecipeComplementTypes.flatMap((type) =>
		recipe.complements.filter((complement) => complement.type === type),
	)
	const complementsWithInstructions = complements.filter(
		(complement) => complement.instructions.trim() !== '',
	)

	return (
		<button
			onClick={onButtonClick}
			className='relative hover:bg-forest-150 p-1 rounded-xl transition-colors duration-300'>
			<ArrowDownToLine size={24} className='text-forest-200' />
			<div className='fixed -left-2499.75 top-0 opacity-0 pointer-events-none w-96'>
				<div
					ref={ref}
					className='w-full flex flex-col items-center justify-center overflow-hidden p-5'>
					<div
						className={cn(
							'w-full mt-3 rounded-3xl border-8 border-b-16',
							'flex flex-col items-center justify-center shadow-center-sm border-forest-150 bg-forest-150',
						)}>
						<div className='w-full px-2'>
							<div className='text-left border-y-8 border-forest-150 bg-forest-150 rounded-t-[20px]'>
								<div className='flex h-12.5 w-full items-center justify-center rounded-[20px] bg-forest-50 px-4 shadow-center-sm'>
									<span className='text-center text-lg md:text-xl text-forest-200 font-black leading-4 font-title'>
										{recipe.name}
									</span>
								</div>
							</div>
							<div className='flex flex-wrap justify-center gap-1.5 px-4 my-2'>
								<span className='inline-flex items-center gap-1.5 rounded-lg bg-forest-200/75 px-2.5 py-1 text-xs font-bold text-forest-50'>
									<Icon
										name={recipe.course}
										size={14}
										className='stroke-forest-50'
									/>
									{t_courses(recipe.course.toLowerCase())}
								</span>
								{recipe.categories.map((category) => (
									<span
										key={category}
										className='inline-flex items-center rounded-lg bg-forest-100 px-2.5 py-1 text-xs font-semibold text-forest-200'>
										{t_categories(category.toLowerCase())}
									</span>
								))}
							</div>
							<div className='border-y-8 border-forest-150 py-0 bg-forest-150 rounded-[20px]'>
								{recipe.images && recipe.images.length > 0 && (
									<div className='bg-forest-100 mb-2 rounded-[20px] shadow-center-sm'>
										{recipe.images.length === 1 ? (
											<div className='w-full p-4'>
												<img
													src={`/api/proxy?url=${encodeURIComponent(recipe.images[0])}&w=640`}
													alt='Recipe photo'
													className='w-full aspect-4/3 object-cover rounded-xl shadow-center-sm'
												/>
											</div>
										) : recipe.images.length === 2 ? (
											<div className='w-full p-4'>
												<div className='grid grid-cols-2 gap-4'>
													{recipe.images
														.slice(0, 2)
														.map((img, i) => (
															<img
																key={i}
																src={`/api/proxy?url=${encodeURIComponent(img)}&w=640`}
																alt={`Recipe photo ${i + 1}`}
																className='w-full aspect-square object-cover rounded-xl shadow-center-sm'
															/>
														))}
												</div>
											</div>
										) : (
											<div className='w-full p-4'>
												<div className='flex flex-col gap-4'>
													<img
														src={`/api/proxy?url=${encodeURIComponent(recipe.images[0])}&w=640`}
														alt='Recipe photo 1'
														className='w-full aspect-4/3 object-cover rounded-xl shadow-center-sm'
													/>
													<div className='grid grid-cols-2 gap-4'>
														{recipe.images
															.slice(1, 3)
															.map((img, i) => (
																<img
																	key={i}
																	src={`/api/proxy?url=${encodeURIComponent(img)}&w=640`}
																	alt={`Recipe photo ${i + 2}`}
																	className='w-full aspect-square object-cover rounded-xl shadow-center-sm'
																/>
															))}
													</div>
												</div>
											</div>
										)}
									</div>
								)}
								{recipe.time && (
									<section className='bg-forest-150 border-y-8 border-forest-150'>
										<div className='bg-forest-100 rounded-[20px] shadow-center-sm pt-4 pb-4'>
											<div className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-3 space-y-0 px-4'>
												<div className='min-w-0 text-center'>
													<span className='text-base md:text-lg font-extrabold text-forest-200 leading-none'>
														{t('time')}
													</span>
												</div>
												<div className='shrink-0 bg-forest-50 border-2 border-forest-150 rounded-2xl shadow-center-sm'>
													<div className='flex flex-col px-3 sm:px-5 md:px-12 py-1 items-center text-center'>
														<div className='flex flex-wrap items-center justify-between gap-2'>
															<span className='font-bold text-forest-200'>
																{recipe.time}
															</span>
															<Clock4
																size={16}
																className='stroke-forest-200'
															/>
														</div>
														<span className='w-full whitespace-nowrap text-xs text-left text-forest-200'>
															{t('minutes')}
														</span>
													</div>
												</div>
											</div>
										</div>
									</section>
								)}
								<section className='bg-forest-150 border-y-8 border-forest-150'>
									<div className='bg-forest-100 rounded-[20px] shadow-center-sm pt-3 pb-4'>
										<p className='text-base md:text-lg font-extrabold text-forest-200'>
											{t('ingredients')}
										</p>
										<div className='space-y-4 px-4 pt-3'>
											<div className='flex flex-wrap justify-center gap-1.5'>
												{complements.length > 0 && (
													<p className='w-fit self-center text-xs font-bold text-forest-50 bg-forest-200/75 px-2 py-1 rounded-lg'>
														{t('ingredients-main')}
													</p>
												)}
												{recipe.ingredients.map(
													(ingredient, index) => (
														<span
															key={index}
															className='inline-flex items-center text-xs font-semibold text-forest-200 bg-forest-150 px-2.5 py-1 rounded-lg'>
															{ingredient}
														</span>
													),
												)}
											</div>
											{complements.map((complement) => (
												<div key={complement.type}>
													<div className='flex flex-wrap justify-center gap-1.5'>
														<p className='w-fit self-center text-xs font-bold text-forest-50 bg-forest-200/75 px-2 py-1 rounded-lg'>
															{t(
																`complement-${complement.type.toLowerCase()}`,
															)}
														</p>
														{complement.ingredients.map(
															(ingredient, index) => (
																<span
																	key={`${complement.type}-${index}`}
																	className='inline-flex items-center text-xs font-semibold text-forest-200 bg-forest-150 px-2.5 py-1 rounded-lg'>
																	{ingredient}
																</span>
															),
														)}
													</div>
												</div>
											))}
										</div>
									</div>
								</section>
								<section className='bg-forest-150 border-y-8 border-forest-150'>
									<div className='bg-forest-100 rounded-[20px] shadow-center-sm pt-3 pb-4'>
										<div className='px-4'>
											<p className='text-base md:text-lg font-extrabold text-forest-200'>
												{t('instructions')}
											</p>
											<div className='shadow-center-sm mt-3 rounded-2xl border-2 border-forest-150 bg-forest-50 px-4 py-3 text-left text-sm md:text-base font-medium text-forest-200'>
												<p className='whitespace-pre-line'>
													{recipe.instructions}
												</p>
												{complementsWithInstructions.map(
													(complement) => (
														<div
															key={complement.type}
															className='mt-4'>
															<p className='w-fit text-xs font-bold text-forest-50 bg-forest-200/75 px-2 py-1 rounded-lg'>
																{t(
																	`complement-${complement.type.toLowerCase()}`,
																)}
															</p>
															<p className='mt-1 whitespace-pre-line'>
																{
																	complement.instructions
																}
															</p>
														</div>
													),
												)}
											</div>
										</div>
									</div>
								</section>
								{recipe.sourceUrls &&
									recipe.sourceUrls.length > 0 && (
										<section className='bg-forest-150 border-y-8 border-forest-150'>
											<div className='bg-forest-100 rounded-[20px] shadow-center-sm pt-3 pb-4'>
												<p className='text-base md:text-lg font-extrabold text-forest-200'>
													{t('sources')}
												</p>
												<div className='mx-4 mt-3 flex flex-wrap items-center justify-center gap-1.5'>
													{recipe.sourceUrls.map(
														(url, index) => (
															<div
																key={index}
																className='flex min-w-0 max-w-full items-center justify-between rounded-lg bg-forest-150 px-3 py-1 text-forest-200 transition-colors hover:text-forest-300'>
																<span className='flex min-w-0 max-w-full items-center gap-2'>
																	<ExternalLink
																		size={14}
																		className='shrink-0'
																	/>
																	<span className='truncate py-1 text-xs font-semibold'>
																		{new URL(
																			url,
																		).hostname.replace(
																			'www.',
																			'',
																		)}
																	</span>
																</span>
															</div>
														),
													)}
												</div>
											</div>
										</section>
									)}
							</div>
							<div className='w-full block bg-forest-150 rounded-b-[20px]'>
								<div className='w-full flex items-center justify-center gap-3 bg-forest-50 rounded-[20px] px-3 py-2.5 transition-colors duration-200'>
									<div className='w-8 h-8 shrink-0 rounded-lg overflow-hidden shadow-center-sm'>
										<Image
											src={author.image}
											referrerPolicy='no-referrer'
											alt='Profile image'
											width={32}
											height={32}
										/>
									</div>
									<span className='font-extrabold font-title text-forest-300 text-sm md:text-base truncate'>
										{`@${author.name}`}
									</span>
								</div>
							</div>
						</div>
					</div>
					<div className='my-3 text-center'>
						<p className='text-sm text-forest-300'>{t('more-on')}</p>
						<p className='text-forest-300 font-extrabold font-title'>
							{new URL(SITE_URL).host}
						</p>
					</div>
				</div>
			</div>
		</button>
	)
}
