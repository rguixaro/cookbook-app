'use client'

import { useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ArrowDownToLine, Clock, ExternalLink } from 'lucide-react'
import { Icon } from '@/components/recipes/icon'
import { toPng } from 'html-to-image'
import { toast } from 'sonner'

import { cn, IconProps, SITE_URL } from '@/utils'

type DownloadableRecipe = {
	slug: string
	name: string
	category: string
	time: number | null
	ingredients: string[]
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
		} catch (_err) {
			console.log(_err)
			toast.error(t_toasts('error'))
		}
	}, [ref, recipe, t_toasts])

	if (!recipe) return null

	return (
		<button
			onClick={onButtonClick}
			className='relative hover:bg-forest-100 p-1 rounded-xl transition-colors duration-300'>
			<ArrowDownToLine size={24} className='text-forest-200' />
			<div className='fixed -left-2499.75 top-0 opacity-0 pointer-events-none w-96'>
				<div
					ref={ref}
					className='w-full flex flex-col items-center justify-center overflow-hidden p-5'>
					<div
						className={cn(
							'w-full my-3 flex flex-col items-center justify-center bg-forest-150 border-8 border-forest-150 rounded-3xl shadow-center-sm',
						)}>
						<div className='w-full border-b-8 border-forest-150 bg-forest-150 rounded-t-[20px]'>
							<div className='bg-forest-50 rounded-[20px] p-4 shadow-center-sm w-full min-h-12.5 flex items-center justify-center'>
								<Icon name={recipe.category} />
								<span className='ms-2 text-lg md:text-xl text-forest-300 font-black leading-4 font-title'>
									{recipe.name}
								</span>
							</div>
						</div>
						<div className='bg-forest-100 rounded-[20px]'>
							{recipe.images && recipe.images.length > 0 && (
								<div className='w-full px-4 pt-4'>
									{recipe.images.length === 1 ? (
										<img
											src={`/api/proxy?url=${encodeURIComponent(recipe.images[0])}&w=640`}
											alt='Recipe photo'
											className='w-full aspect-4/3 object-cover rounded-xl'
										/>
									) : recipe.images.length === 2 ? (
										<div className='grid grid-cols-2 gap-2'>
											{recipe.images
												.slice(0, 2)
												.map((img, i) => (
													<img
														key={i}
														src={`/api/proxy?url=${encodeURIComponent(img)}&w=640`}
														alt={`Recipe photo ${i + 1}`}
														className='w-full aspect-square object-cover rounded-xl'
													/>
												))}
										</div>
									) : (
										<div className='flex flex-col gap-2'>
											<img
												src={`/api/proxy?url=${encodeURIComponent(recipe.images[0])}&w=640`}
												alt='Recipe photo 1'
												className='w-full aspect-4/3 object-cover rounded-xl'
											/>
											<div className='grid grid-cols-2 gap-2'>
												{recipe.images
													.slice(1, 3)
													.map((img, i) => (
														<img
															key={i}
															src={`/api/proxy?url=${encodeURIComponent(img)}&w=640`}
															alt={`Recipe photo ${i + 2}`}
															className='w-full aspect-square object-cover rounded-xl'
														/>
													))}
											</div>
										</div>
									)}
								</div>
							)}
							<div
								className={cn(
									'w-full mb-2 p-5 flex flex-col items-center justify-center',
								)}>
								{recipe.time && (
									<div className='flex mb-3 items-center bg-forest-200 text-forest-50 px-3 py-1 rounded-xl'>
										<p className='font-extrabold text-sm'>
											{t('time')}
										</p>
										<Clock
											{...IconProps}
											className='stroke-forest-50 ms-5 mr-1'
										/>
										<span className='text-xs font-bold'>{`${recipe.time}'`}</span>
									</div>
								)}
								<div>
									<p className='font-extrabold text-forest-300 text-sm mb-2'>
										{t('ingredients')}
									</p>
									<div className='flex flex-wrap justify-center gap-1.5'>
										{recipe.ingredients.map(
											(ingredient, index) => (
												<span
													key={index}
													className='inline-flex items-center text-xs font-semibold text-forest-300 bg-forest-150 px-2.5 py-1 rounded-lg'>
													{ingredient}
												</span>
											),
										)}
									</div>
								</div>
								<div className='h-2 w-3/4 my-3 rounded bg-forest-150' />
								<div className='text-sm'>
									<p className='font-extrabold text-forest-300'>
										{t('instructions')}
									</p>
									<span className='font-normal text-justify text-forest-400'>
										{recipe.instructions}
									</span>
								</div>
								{recipe.sourceUrls &&
									recipe.sourceUrls.length > 0 && (
										<>
											<div className='h-2 w-3/4 my-3 rounded bg-forest-150' />
											<div className='text-sm'>
												<p className='font-extrabold text-forest-300'>
													{t('sources')}
												</p>
												<div className='flex flex-col gap-1 mt-1'>
													{recipe.sourceUrls.map(
														(url, index) => (
															<div
																key={index}
																className='flex items-center gap-1.5 text-forest-200'>
																<ExternalLink
																	size={14}
																	className='shrink-0'
																/>
																<span className='truncate text-sm'>
																	{new URL(
																		url,
																	).hostname.replace(
																		'www.',
																		'',
																	)}
																</span>
															</div>
														),
													)}
												</div>
											</div>
										</>
									)}
							</div>
						</div>
						<div className='w-full block border-t-8 border-forest-150 bg-forest-150 rounded-b-[20px]'>
							<div className='w-full flex items-center justify-center gap-3 bg-forest-50 rounded-[20px] px-3 py-2.5'>
								<div className='w-8 h-8 shrink-0 rounded-lg overflow-hidden shadow-center-sm'>
									<Image
										src={author.image}
										referrerPolicy='no-referrer'
										alt='Profile image'
										width={32}
										height={32}
									/>
								</div>
								<span className='font-extrabold font-title text-forest-300 leading-4 text-sm truncate'>
									{`@${author.name}`}
								</span>
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
			</div>
		</button>
	)
}
