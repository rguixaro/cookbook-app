'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { cn } from '@/utils'

interface GoBackProps {
	to?: string
	text?: string
	children?: React.ReactNode
}

export const GoBack = ({ to = '/', text = 'return', children }: GoBackProps) => {
	const t = useTranslations('common')

	return (
		<div className='w-full flex justify-between items-center'>
			<Link
				href={to}
				className={cn(
					'flex w-fit mb-2 p-1 px-3 rounded-[5px] items-center text-neutral-600 text-sm md:text-base',
					'transition-all duration-300 hover:bg-forest-200/15 group'
				)}>
				<svg
					xmlns='http://www.w3.org/2000/svg'
					width='20'
					height='20'
					viewBox='0 0 24 24'
					fill='none'
					strokeWidth='2.5'
					strokeLinecap='round'
					strokeLinejoin='round'
					className='stroke-forest-200'>
					<line
						x1='5'
						y1='12'
						x2='19'
						y2='12'
						className='scale-x-0 group-hover:scale-x-100 -translate-x-4 group-hover:-translate-x-1 transition-all duration-300 ease-in-out'
					/>
					<polyline
						points='12 19 5 12 12 5'
						className='translate-x-0 group-hover:-translate-x-1 transition-all duration-300 ease-in-out'
					/>
				</svg>
				{/* @ts-expect-error: Unnecessary message type */}
				{t(text)}
			</Link>
			{children}
		</div>
	)
}
