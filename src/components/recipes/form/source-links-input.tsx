'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, X } from 'lucide-react'

import { cn } from '@/utils'
import { Button, FormControl, InputGlobalStyles } from '@/ui'

interface SourceLinksInputProps {
	values: string[]
	setValues: (value: string[]) => void
	disabled?: boolean
}

const MAX_SOURCE_LINKS = 2

export const SourceLinksInput = ({
	values,
	setValues,
	disabled = false,
}: SourceLinksInputProps) => {
	const t = useTranslations('RecipesPage')
	const [currUrl, setCurrUrl] = useState<string>('')

	const trimmedUrl = currUrl.trim()
	const hasReachedLimit = values.length >= MAX_SOURCE_LINKS
	const showInvalidUrl = trimmedUrl !== '' && !isValidHttpUrl(trimmedUrl)
	const canAdd = !disabled && !hasReachedLimit && isValidHttpUrl(trimmedUrl)

	function isValidHttpUrl(str: string): boolean {
		try {
			const url = new URL(str)
			return url.protocol === 'http:' || url.protocol === 'https:'
		} catch {
			return false
		}
	}

	function addLinks(urls: string[]) {
		if (disabled) return
		const availableSlots = MAX_SOURCE_LINKS - values.length
		if (availableSlots <= 0) return

		const validUrls = urls
			.map((url) => url.trim())
			.filter((url) => isValidHttpUrl(url))
			.slice(0, availableSlots)

		if (validUrls.length === 0) return

		setValues([...values, ...validUrls])
		setCurrUrl('')
	}

	function addCurrentLink() {
		addLinks([trimmedUrl])
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key !== 'Enter') return
		event.preventDefault()
		addCurrentLink()
	}

	function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
		const pasted = event.clipboardData.getData('text')
		if (!pasted.includes('\n')) return

		event.preventDefault()
		addLinks(pasted.split(/\n/))
	}

	return (
		<>
			<FormControl>
				<div className='my-2 flex items-center gap-2'>
					<input
						value={currUrl}
						className={cn(
							InputGlobalStyles,
							'rounded-2xl py-5 bg-forest-50 border-2 focus-visible:ring-0',
							showInvalidUrl && 'border-forest-400',
						)}
						placeholder={t('source-links-placeholder')}
						disabled={disabled || hasReachedLimit}
						aria-invalid={showInvalidUrl}
						onChange={(e) => setCurrUrl(e.currentTarget.value)}
						onKeyDown={handleKeyDown}
						onPaste={handlePaste}
					/>
					<Button
						type='button'
						className='shrink-0'
						disabled={!canAdd}
						onClick={addCurrentLink}>
						<b>{t('source-links-add')}</b>
					</Button>
				</div>
			</FormControl>
			{showInvalidUrl && (
				<p className='mt-1 text-left text-[0.8rem] font-bold text-forest-400'>
					{t('source-links-invalid')}
				</p>
			)}
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
							aria-label={t('source-links-remove', { url })}
							disabled={disabled}
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
