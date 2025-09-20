'use client'

import { useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ArrowDownToLine, Clock } from 'lucide-react'
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

	const onButtonClick = useCallback(() => {
		if (ref.current === null || !recipe) return

		toPng(ref.current, {
			cacheBust: true,
			backgroundColor: '#eaf0e2',
			quality: 1,
			width: 384,
		})
			.then((dataUrl) => {
				const link = document.createElement('a')
				link.download = `${recipe.slug}.png`
				link.href = dataUrl
				link.click()
			})
			.catch((_err) => {
				toast.error(t_toasts('error'))
			})
	}, [ref, recipe])

	if (!recipe) return null

	return (
		<button
			onClick={onButtonClick}
			className='hover:bg-forest-200/15 p-1 rounded transition-colors duration-300'>
			<ArrowDownToLine size={24} className='text-forest-200' />
			<div className='absolute opacity-0 pointer-events-none w-96'>
				<div
					ref={ref}
					className='w-full flex flex-col items-center justify-center'>
					<div className='w-4/5 text-center h-24 border-b-4 border-forest-300'>
						<TypographyH1 className='font-title text-forest-300 pb-5'>
							{'CookBook'}
						</TypographyH1>
					</div>
					<div
						className={cn(
							'w-full my-3 p-5 flex flex-col items-center justify-center'
						)}>
						<TypographyH4 className='text-2xl text-forest-300 font-bold'>
							{recipe.name}
						</TypographyH4>
						<div className='h-1 w-2/4 mt-3 mb-7 bg-forest-300/75' />
						{recipe.time && (
							<div className='flex flex-col items-center w-full'>
								<div className='flex items-center'>
									<p className='font-semibold text-forest-300'>
										{t('time').toUpperCase()}
									</p>
									<span className='text-xs md:text-sm text-forest-400 ms-5 mr-1'>{`${recipe.time}'`}</span>
									<Clock {...IconProps} color='#3D6C5F' />
								</div>
								<div className='h-0.5 w-3/4 my-3 bg-forest-300/15' />{' '}
							</div>
						)}
						<div className='text-sm md:text-base'>
							<p className='font-semibold text-forest-300'>
								{t('ingredients').toUpperCase()}
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
						<div className='h-0.5 w-3/4 my-3 bg-forest-300/15' />
						<div className='text-sm md:text-base'>
							<p className='font-semibold text-forest-300'>
								{t('instructions').toUpperCase()}
							</p>
							<span className='font-normal text-justify text-forest-400'>
								{recipe.instructions}
							</span>
						</div>
						<div className='h-1 w-2/4 mt-7 bg-forest-300/75' />
						<div className='mt-3'>
							<div className='flex flex-col items-center justify-center space-y-2'>
								<Image
									src={author.image}
									referrerPolicy='no-referrer'
									alt='Profile image'
									width={32}
									height={32}
									className='rounded border-2 border-forest-200'
								/>
								<span className='font-semibold text-forest-200 text-sm'>
									{` @${author.name}`}
								</span>
							</div>
						</div>
						<div className='mt-5'>
							<p>{t('more-on')}</p>
							<p className='text-forest-300 font-extrabold'>
								cookbook.rguixaro.dev
							</p>
						</div>
					</div>
				</div>
			</div>
		</button>
	)
}
