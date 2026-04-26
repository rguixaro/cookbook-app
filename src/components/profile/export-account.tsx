'use client'

import { useState } from 'react'
import { DownloadIcon, FileJsonIcon, ImagesIcon, LoaderIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { Button } from '@/ui'
import { ProfileCard } from './card'
import { cn } from '@/utils'

type ExportKind = 'data' | 'images'

function filenameFromContentDisposition(value: string | null, fallback: string) {
	const filename = value?.match(/filename="([^"]+)"/)?.[1]
	return filename || fallback
}

function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = filename
	link.click()
	URL.revokeObjectURL(url)
}

export function ExportAccount() {
	const t = useTranslations('ProfilePage')
	const t_toasts = useTranslations('toasts')
	const [loading, setLoading] = useState<Record<ExportKind, boolean>>({
		data: false,
		images: false,
	})

	const handleExport = (kind: ExportKind) => async () => {
		const url =
			kind === 'data'
				? '/api/profile/export/data'
				: '/api/profile/export/images'
		const fallback =
			kind === 'data'
				? 'cookbook-profile-export.json'
				: 'cookbook-recipe-images.zip'

		try {
			setLoading((current) => ({ ...current, [kind]: true }))
			const response = await fetch(url, { cache: 'no-store' })

			if (!response.ok) throw new Error('Export failed')

			const blob = await response.blob()
			downloadBlob(
				blob,
				filenameFromContentDisposition(
					response.headers.get('Content-Disposition'),
					fallback,
				),
			)
			toast.success(
				kind === 'data'
					? t('export-data-complete')
					: t('export-images-complete'),
			)
		} catch {
			toast.error(t_toasts('error'))
		} finally {
			setLoading((current) => ({ ...current, [kind]: false }))
		}
	}

	return (
		<ProfileCard
			title={t('exports-title')}
			description={t('exports-description')}
			action={<DownloadIcon size={20} className='text-forest-300' />}>
			<div className='grid gap-3 text-forest-400'>
				<Button
					type='button'
					variant='default'
					disabled={loading.data}
					onClick={handleExport('data')}
					className={cn(
						'relative h-auto w-full justify-start whitespace-normal py-3 pr-10',
						'bg-forest-50 hover:bg-forest-200 text-forest-300 hover:text-forest-50',
						'transition-colors duration-300',
					)}>
					<FileJsonIcon size={18} className='shrink-0' />
					<span className='flex flex-col items-start text-left'>
						<span className='font-bold'>{t('export-data')}</span>
						<span className='text-xs font-normal opacity-80'>
							{t('export-data-description')}
						</span>
					</span>
					{loading.data && (
						<LoaderIcon
							size={18}
							className='absolute right-3 animate-spin'
							aria-label={t('export-loading')}
						/>
					)}
				</Button>
				<Button
					type='button'
					variant='default'
					disabled={loading.images}
					onClick={handleExport('images')}
					className={cn(
						'relative h-auto w-full justify-start whitespace-normal py-3 pr-10',
						'bg-forest-50 hover:bg-forest-200 text-forest-300 hover:text-forest-50',
						'transition-colors duration-300',
					)}>
					<ImagesIcon size={18} className='shrink-0' />
					<span className='flex flex-col items-start text-left'>
						<span className='font-bold'>{t('export-images')}</span>
						<span className='text-xs font-normal opacity-80'>
							{t('export-images-description')}
						</span>
					</span>
					{loading.images && (
						<LoaderIcon
							size={18}
							className='absolute right-3 animate-spin'
							aria-label={t('export-loading')}
						/>
					)}
				</Button>
			</div>
		</ProfileCard>
	)
}
