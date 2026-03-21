'use client'

import { useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ArrowDownToLine, Clock } from 'lucide-react'
import { Icon } from '@/components/recipes/icon'
import { toPng } from 'html-to-image'
import { toast } from 'sonner'

import { Recipe } from '@/types'
import { TypographyH1, TypographyH4 } from '@/ui'
import { cn, IconProps } from '@/utils'

export const RecipeDownload = ({
	recipe,
	author,
}: {
	recipe: Recipe | null
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
					const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
					const format = f.url.endsWith('.otf') ? 'opentype' : 'truetype'
					return `@font-face { font-family: '${f.family || 'Montserrat'}'; src: url(data:font/${format};base64,${base64}) format('${format}'); font-weight: ${f.weight}; }`
				}),
			)

			const dataUrl = await toPng(ref.current, {
				cacheBust: true,
				backgroundColor: '#fefff2',
				quality: 1,
				width: 384,
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
			className='hover:bg-forest-200/15 p-1 rounded-xl transition-colors duration-300'>
			<ArrowDownToLine size={24} className='text-forest-200' />
			<div className='absolute opacity-0 pointer-events-none w-96'>
				<div
					ref={ref}
					className='w-full flex flex-col items-center justify-center overflow-hidden p-4'>
					<div
						className={cn(
							'w-full my-3 flex flex-col items-center justify-center bg-forest-200/15 rounded-3xl border-4 border-forest-400/15',
						)}>
						<div className='bg-[#fefff2] rounded-[20px] p-4 w-full flex items-center justify-center'>
							<Icon name={recipe.category} />
							<span className='ms-2 text-lg text-forest-300 font-black leading-4 font-title'>
								{recipe.name}
							</span>
						</div>
						<div
							className={cn(
								'w-full mb-2 p-5 flex flex-col items-center justify-center',
							)}>
							{recipe.time && (
								<div className='flex mb-3 items-center bg-forest-200 text-white px-2 py-1 rounded-xl'>
									<p className='font-extrabold'>{t('time')}</p>
									<Clock
										{...IconProps}
										className='stroke-white ms-5 mr-1'
									/>
									<span className='text-xs font-bold'>{`${recipe.time}'`}</span>
								</div>
							)}
							<div className='text-sm'>
								<p className='font-extrabold text-forest-300'>
									{t('ingredients')}
								</p>
								<span className='font-normal'>
									{recipe.ingredients.map((ingredient, index) => (
										<div
											key={index}
											className='font-normal text-forest-400'>
											{ingredient}
										</div>
									))}
								</span>
							</div>
							<div className='h-1.5 w-3/4 my-3 rounded bg-forest-400/15' />
							<div className='text-sm'>
								<p className='font-extrabold text-forest-300'>
									{t('instructions')}
								</p>
								<span className='font-normal text-justify text-forest-400'>
									{recipe.instructions}
								</span>
							</div>
							<div className='h-1.5 w-3/4 my-3 rounded-xl bg-forest-400/15' />
							<div className='mt-3'>
								<div className='flex flex-col items-center justify-center space-y-1'>
									<Image
										src={author.image}
										referrerPolicy='no-referrer'
										alt='Profile image'
										width={40}
										height={40}
										className='rounded-xl border-2 border-forest-200/15 shadow-sm'
									/>
									<span className='font-bold text-forest-300 text-sm bg-[#fefff2] px-2 py-1 rounded-xl shadow-sm'>
										{` @${author.name}`}
									</span>
								</div>
							</div>
							<div className='mt-5'>
								<p>{t('more-on')}</p>
								<p className='text-forest-300 font-extrabold font-title'>
									cookbook.rguixaro.dev
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</button>
	)
}
