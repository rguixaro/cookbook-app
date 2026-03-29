'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, Plus, X } from 'lucide-react'

import { cn } from '@/utils'
import { FormControl, InputGlobalStyles } from '@/ui'

interface SourceLinksInputProps {
	values: string[]
	setValues: (value: string[]) => void
}

export const SourceLinksInput = ({ values, setValues }: SourceLinksInputProps) => {
	const t = useTranslations('RecipesPage')
	const [currUrl, setCurrUrl] = useState<string>('')

	function isValidHttpUrl(str: string): boolean {
		try {
			const url = new URL(str)
			return url.protocol === 'http:' || url.protocol === 'https:'
		} catch {
			return false
		}
	}

	function addLink(event?: React.KeyboardEvent<HTMLInputElement>) {
		if (event && event.key !== 'Enter') return
		const trimmed = currUrl.trim()
		if (trimmed === '' || !isValidHttpUrl(trimmed)) return
		setValues([...values, trimmed])
		setCurrUrl('')
		event?.preventDefault()
	}

	return (
		<>
			<FormControl>
				<div className='relative my-2'>
					<button
						type='button'
						className='absolute left-2 top-1/2 transform -translate-y-1/2 focus-visible:outline-none focus-visible:ring-0'
						onClick={() => addLink()}>
						<Plus className='stroke-forest-200' size={24} />
					</button>
					<input
						value={currUrl}
						className={cn(
							InputGlobalStyles,
							'rounded-2xl ps-10 py-5 bg-forest-50 border-2',
						)}
						placeholder={t('source-links-placeholder')}
						onChange={(e) => setCurrUrl(e.currentTarget.value)}
						onKeyDown={addLink}
					/>
				</div>
			</FormControl>
			<div className='mx-4'>
				{values.map((url, index) => (
					<div
						key={index}
						className='flex items-center justify-between bg-forest-150 rounded-2xl shadow-center-sm my-2 py-1 px-3'>
						<div className='flex items-center gap-2 min-w-0'>
							<Link size={14} className='shrink-0 text-forest-200' />
							<span className='py-1 text-forest-200 truncate text-sm'>
								{url}
							</span>
						</div>
						<button
							type='button'
							onClick={() =>
								setValues(values.filter((_, i) => i !== index))
							}>
							<X className='stroke-forest-200' size={18} />
						</button>
					</div>
				))}
			</div>
		</>
	)
}
