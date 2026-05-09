import type { ReactNode } from 'react'

import { GoBack } from '@/components/layout'
import { TypographyH1, TypographyH3, TypographyListUl, TypographyP } from '@/ui'

type LegalSection = {
	title: string
	paragraphs?: ReactNode[]
	items?: ReactNode[]
}

interface LegalDocumentProps {
	title: string
	lastUpdated: string
	intro: ReactNode[]
	sections: LegalSection[]
}

export function LegalDocument({
	title,
	lastUpdated,
	intro,
	sections,
}: LegalDocumentProps) {
	return (
		<main className='mx-auto flex w-11/12 max-w-3xl flex-col pb-20 pt-6 text-forest-300 sm:w-4/5 lg:w-3/5'>
			<div className='mb-6'>
				<GoBack />
			</div>
			<div className='border-b-2 border-forest-150 pb-6'>
				<TypographyH1 className='font-title text-4xl text-forest-400'>
					{title}
				</TypographyH1>
				<p className='mt-3 text-sm font-bold text-forest-200'>
					Last updated: {lastUpdated}
				</p>
				<div className='mt-6 space-y-4'>
					{intro.map((paragraph, index) => (
						<TypographyP key={index} className='text-forest-300'>
							{paragraph}
						</TypographyP>
					))}
				</div>
			</div>
			<div className='mt-3'>
				{sections.map((section) => (
					<section
						key={section.title}
						className='border-b border-forest-150 py-6'>
						<TypographyH3 className='my-0 text-2xl text-forest-400 lg:text-3xl'>
							{section.title}
						</TypographyH3>
						{section.paragraphs ? (
							<div className='mt-4 space-y-4'>
								{section.paragraphs.map((paragraph, index) => (
									<TypographyP
										key={index}
										className='text-forest-300'>
										{paragraph}
									</TypographyP>
								))}
							</div>
						) : null}
						{section.items ? (
							<TypographyListUl className='ml-5 text-forest-300'>
								{section.items.map((item, index) => (
									<li key={index}>{item}</li>
								))}
							</TypographyListUl>
						) : null}
					</section>
				))}
			</div>
		</main>
	)
}
