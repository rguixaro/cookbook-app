'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, X } from 'lucide-react'

import { cn } from '@/utils'
import { Button, FormControl, FormMessage, InputGlobalStyles } from '@/ui'

interface SourceLinksInputProps {
	values: string[]
	setValues: (value: string[]) => void
	disabled?: boolean
	onInputErrorChange?: (message: string | null) => void
}

const MAX_SOURCE_LINKS = 2

export const SourceLinksInput = ({
	values,
	setValues,
	disabled = false,
	onInputErrorChange,
}: SourceLinksInputProps) => {
	const t = useTranslations('RecipesPage')
	const [currUrl, setCurrUrl] = useState<string>('')

	const trimmedUrl = currUrl.trim()
	const hasReachedLimit = values.length >= MAX_SOURCE_LINKS
	const showInvalidUrl = trimmedUrl !== '' && !isValidHttpsUrl(trimmedUrl)
	const canAdd = !disabled && !hasReachedLimit && isValidHttpsUrl(trimmedUrl)

	useEffect(() => {
		onInputErrorChange?.(showInvalidUrl ? 'source-url-invalid' : null)
	}, [onInputErrorChange, showInvalidUrl])

	function isValidHttpsUrl(str: string): boolean {
		try {
			const url = new URL(str)
			return url.protocol === 'https:'
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
			.filter((url) => isValidHttpsUrl(url))
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
				<div
					className={cn(
						'mt-3 flex items-center gap-2 mx-4',
						values.length > 0 && 'my-3',
					)}>
					<input
						value={currUrl}
						className={cn(
							InputGlobalStyles,
							'rounded-2xl py-5 bg-forest-50 border-2 focus-visible:ring-0 placeholder:text-forest-200/75',
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
						className='shrink-0 py-5'
						disabled={!canAdd}
						onClick={addCurrentLink}>
						<b>{t('source-links-add')}</b>
					</Button>
				</div>
			</FormControl>
			<FormMessage className={cn('mb-0 mt-0', values.length == 0 && 'mt-3')} />
			{showInvalidUrl && !onInputErrorChange && (
				<p className='mt-1 text-left text-[0.8rem] font-bold text-forest-400'>
					{t('source-links-invalid')}
				</p>
			)}
			<div className={cn('mx-4', values.length > 0 && 'mt-3')}>
				{values.map((url, index) => (
					<div
						key={index}
						className='flex items-center justify-between bg-forest-150 text-forest-200 rounded-lg py-1 px-3'>
						<div className='flex items-center gap-2 min-w-0'>
							<Link size={14} className='shrink-0' />
							<span className='py-1 truncate font-semibold text-xs'>
								{url}
							</span>
						</div>
						<button
							type='button'
							aria-label={t('source-links-remove', { url })}
							disabled={disabled}
							className='hover:text-forest-400 transition-colors'
							onClick={() =>
								setValues(values.filter((_, i) => i !== index))
							}>
							<X size={18} />
						</button>
					</div>
				))}
			</div>
		</>
	)
}
