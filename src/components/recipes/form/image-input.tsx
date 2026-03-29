'use client'

import { useRef } from 'react'
import Image, { ImageLoader } from 'next/image'
import { useTranslations } from 'next-intl'
import { ImagePlus, Star, X } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/utils'

const proxyLoader: ImageLoader = ({ src, width, quality }) => {
	return `/api/proxy?url=${encodeURIComponent(src)}&w=${width}${quality ? `&q=${quality}` : ''}`
}

/** Returns true for remote CloudFront URLs (not base64 data URIs) */
function isRemoteUrl(src: string): boolean {
	return src.startsWith('http')
}

interface RecipeImageInputProps {
	images: string[]
	onChange: (images: string[]) => void
	files: (File | null)[]
	onFilesChange: (files: (File | null)[]) => void
	coverIndex: number
	onCoverChange: (index: number) => void
	disabled?: boolean
}

/**
 * Image gallery input for recipe forms.
 * Always renders the full 3-slot layout (matching the display gallery):
 *  - Slot 0: top hero (aspect-4/3)
 *  - Slot 1 & 2: bottom row (aspect-square each)
 * Filled slots show the image with remove + cover selection buttons.
 * Empty slots show a dashed-border upload placeholder.
 *
 * `images` holds preview URLs (base64 for new uploads, CloudFront URLs for existing).
 * `files` holds File objects for new uploads (null for existing images).
 */
export function RecipeImageInput({
	images,
	onChange,
	files,
	onFilesChange,
	coverIndex,
	onCoverChange,
	disabled,
}: RecipeImageInputProps) {
	const t = useTranslations('toasts')
	const inputRef = useRef<HTMLInputElement>(null)
	const targetSlot = useRef<number>(0)

	const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB — matches server limit

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		if (file.size > MAX_FILE_SIZE) {
			e.target.value = ''
			toast.error(t('error-file-too-large'))
			return
		}

		const reader = new FileReader()
		reader.onload = () => {
			const result = reader.result as string
			const slot = targetSlot.current

			const nextImages = [...images]
			const nextFiles = [...files]

			nextImages[slot] = result
			nextFiles[slot] = file

			// Filter out empty slots while keeping alignment
			const filtered = nextImages.reduce<{
				imgs: string[]
				fls: (File | null)[]
			}>(
				(acc, img, i) => {
					if (img) {
						acc.imgs.push(img)
						acc.fls.push(nextFiles[i] ?? null)
					}
					return acc
				},
				{ imgs: [], fls: [] },
			)

			onChange(filtered.imgs)
			onFilesChange(filtered.fls)
		}
		reader.readAsDataURL(file)

		// Reset so the same file can be re-selected
		e.target.value = ''
	}

	const triggerUpload = (slot: number) => {
		if (disabled) return
		targetSlot.current = slot
		inputRef.current?.click()
	}

	const removeImage = (index: number) => {
		if (disabled) return
		const nextImages = images.filter((_, i) => i !== index)
		const nextFiles = files.filter((_, i) => i !== index)
		onChange(nextImages)
		onFilesChange(nextFiles)
		// Adjust cover index if needed
		if (coverIndex === index) {
			onCoverChange(0)
		} else if (coverIndex > index) {
			onCoverChange(coverIndex - 1)
		}
	}

	const filled = (index: number) => index < images.length

	return (
		<div className='w-full'>
			<input
				ref={inputRef}
				type='file'
				accept='image/*'
				className='hidden'
				onChange={handleFileSelect}
			/>
			<div className='flex flex-col gap-2'>
				{/* Slot 0 — hero image */}
				{filled(0) ? (
					<FilledSlot
						src={images[0]}
						aspect='aspect-4/3'
						isCover={coverIndex === 0}
						onCover={() => onCoverChange(0)}
						onRemove={() => removeImage(0)}
						disabled={disabled}
					/>
				) : (
					<EmptySlot
						aspect='aspect-4/3'
						onClick={() => triggerUpload(0)}
						disabled={disabled}
					/>
				)}

				{/* Slots 1 & 2 — bottom row */}
				<div className='grid grid-cols-2 gap-2'>
					{[1, 2].map((slot) =>
						filled(slot) ? (
							<FilledSlot
								key={slot}
								src={images[slot]}
								aspect='aspect-square'
								isCover={coverIndex === slot}
								onCover={() => onCoverChange(slot)}
								onRemove={() => removeImage(slot)}
								disabled={disabled}
							/>
						) : (
							<EmptySlot
								key={slot}
								aspect='aspect-square'
								onClick={() => triggerUpload(slot)}
								disabled={disabled}
							/>
						),
					)}
				</div>
			</div>
		</div>
	)
}

function FilledSlot({
	src,
	aspect,
	isCover,
	onCover,
	onRemove,
	disabled,
}: {
	src: string
	aspect: string
	isCover: boolean
	onCover: () => void
	onRemove: () => void
	disabled?: boolean
}) {
	return (
		<div className={cn('relative w-full overflow-hidden rounded-xl', aspect)}>
			<Image
				src={src}
				alt='Recipe image'
				fill
				sizes='(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 25vw'
				className='object-cover'
				{...(isRemoteUrl(src) ? { loader: proxyLoader } : {})}
			/>
			{!disabled && (
				<>
					<button
						type='button'
						onClick={onCover}
						className='absolute top-2 left-2 p-1 rounded-lg transition-colors duration-200 bg-forest-200 hover:bg-forest-300 text-white'>
						<Star size={14} className={isCover ? 'fill-white' : ''} />
					</button>
					<button
						type='button'
						onClick={onRemove}
						className='absolute top-2 right-2 bg-forest-200 hover:bg-forest-300 text-white p-1 rounded-lg transition-colors duration-200'>
						<X size={14} />
					</button>
				</>
			)}
		</div>
	)
}

function EmptySlot({
	aspect,
	onClick,
	disabled,
}: {
	aspect: string
	onClick: () => void
	disabled?: boolean
}) {
	return (
		<button
			type='button'
			onClick={onClick}
			disabled={disabled}
			className={cn(
				'w-full rounded-xl border-2 border-dashed border-forest-200/25',
				'bg-forest-150 flex items-center justify-center',
				'transition-colors duration-200',
				!disabled && 'hover:border-forest-200/50 cursor-pointer',
				disabled && 'opacity-50 cursor-not-allowed',
				aspect,
			)}>
			<ImagePlus size={22} className='text-forest-200' />
		</button>
	)
}
