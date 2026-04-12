'use client'

import { useRef } from 'react'
import Image, { ImageLoader } from 'next/image'
import { useTranslations } from 'next-intl'
import { ImagePlus, Star, X } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/utils'

const MAX_DIMENSION = 2048
const MAX_BLOB_SIZE = 800 * 1024
const JPEG_QUALITY_START = 0.85
const JPEG_QUALITY_MIN = 0.5
const JPEG_QUALITY_STEP = 0.05

/**
 * Compress an image client-side using Canvas.
 * Mirrors the server-side sharp pipeline (2048×2048, JPEG) and
 * guarantees the output stays under MAX_BLOB_SIZE by progressively
 * reducing quality if needed.
 */
function compressImage(file: File): Promise<{ dataUri: string; file: File }> {
	return new Promise((resolve, reject) => {
		const img = new window.Image()
		img.onload = () => {
			URL.revokeObjectURL(img.src)

			let { width, height } = img
			if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
				const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
				width = Math.round(width * ratio)
				height = Math.round(height * ratio)
			}

			const canvas = document.createElement('canvas')
			canvas.width = width
			canvas.height = height

			const ctx = canvas.getContext('2d')
			if (!ctx) {
				reject(new Error('Canvas not supported'))
				return
			}
			ctx.drawImage(img, 0, 0, width, height)

			const tryCompress = (quality: number) => {
				canvas.toBlob(
					(blob) => {
						if (!blob) {
							reject(new Error('Compression failed'))
							return
						}
						if (
							blob.size > MAX_BLOB_SIZE &&
							quality - JPEG_QUALITY_STEP >= JPEG_QUALITY_MIN
						) {
							tryCompress(quality - JPEG_QUALITY_STEP)
							return
						}
						const compressed = new File(
							[blob],
							file.name?.replace(/\.[^.]+$/, '.jpg') || 'image.jpg',
							{ type: 'image/jpeg' },
						)
						const reader = new FileReader()
						reader.onload = () =>
							resolve({
								dataUri: reader.result as string,
								file: compressed,
							})
						reader.onerror = () =>
							reject(new Error('Failed to read compressed image'))
						reader.readAsDataURL(compressed)
					},
					'image/jpeg',
					quality,
				)
			}

			tryCompress(JPEG_QUALITY_START)
		}
		img.onerror = () => reject(new Error('Failed to load image'))
		img.src = URL.createObjectURL(file)
	})
}

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

	const MAX_FILE_SIZE = 50 * 1024 * 1024

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		if (file.size > MAX_FILE_SIZE) {
			e.target.value = ''
			toast.error(t('error-file-too-large'))
			return
		}

		e.target.value = ''

		try {
			const { dataUri, file: compressed } = await compressImage(file)
			const slot = targetSlot.current

			const nextImages = [...images]
			const nextFiles = [...files]

			nextImages[slot] = dataUri
			nextFiles[slot] = compressed

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
		} catch {
			toast.error(t('error'))
		}
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
				'bg-forest-50 flex items-center justify-center',
				'transition-colors duration-200',
				!disabled && 'hover:border-forest-200/50 cursor-pointer',
				disabled && 'opacity-50 cursor-not-allowed',
				aspect,
			)}>
			<ImagePlus size={22} className='text-forest-200' />
		</button>
	)
}
