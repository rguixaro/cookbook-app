'use client'

import Image, { ImageLoader } from 'next/image'
import { useEffect, useState } from 'react'
import { ImageIcon, LoaderIcon, Maximize, Minimize } from 'lucide-react'

import { useCookiesReady } from '@/providers/cookie-provider'
import { cn } from '@/utils'

/**
 * Custom image loader that routes through the proxy API
 * to forward CloudFront signed cookies.
 */
const proxyLoader: ImageLoader = ({ src, width, quality }) => {
	return `/api/proxy?url=${encodeURIComponent(src)}&w=${width}${quality ? `&q=${quality}` : ''}`
}

/**
 * Renders a responsive image gallery for a recipe.
 * - 1 image: full-width landscape
 * - 2 images: side-by-side squares
 * - 3 images: one large on top + two small below
 * Falls back to empty-state placeholder when no images.
 */
export function RecipeGallery({ images }: { images: string[] }) {
	const cookiesReady = useCookiesReady()
	const [tappedIndex, setTappedIndex] = useState<number | null>(null)
	const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

	useEffect(() => {
		if (tappedIndex === null) return

		const timer = setTimeout(() => setTappedIndex(null), 1500)
		return () => clearTimeout(timer)
	}, [tappedIndex])

	if (!images.length) return null

	const count = Math.min(images.length, 3)
	const visibleImages = images.slice(0, count)
	const expandedImage =
		expandedIndex === null ? null : (visibleImages[expandedIndex] ?? null)

	const onTapImage = (index: number) => {
		if (!cookiesReady) return
		setTappedIndex((current) => (current === index ? null : index))
	}

	const fullscreenImage = expandedImage ? (
		<RecipeImageFullscreen
			image={expandedImage}
			imageIndex={expandedIndex ?? 0}
			onClose={() => setExpandedIndex(null)}
		/>
	) : null

	const renderImage = (
		src: string,
		index: number,
		alt: string,
		sizes: string,
		className: string,
	) => (
		<GalleryImage
			key={src}
			src={src}
			alt={alt}
			sizes={sizes}
			cookiesReady={cookiesReady}
			className={className}
			isTapped={tappedIndex === index}
			onTap={() => onTapImage(index)}
			onFullscreen={() => {
				setTappedIndex(null)
				setExpandedIndex(index)
			}}
		/>
	)

	if (count === 1) {
		return (
			<>
				<div className='w-full p-3'>
					{renderImage(
						images[0],
						0,
						'Recipe photo',
						'(max-width: 640px) 92vw, (max-width: 1024px) 50vw, 33vw',
						'aspect-4/3 w-full',
					)}
				</div>
				{fullscreenImage}
			</>
		)
	}

	if (count === 2) {
		return (
			<>
				<div className='w-full px-4 pt-3'>
					<div className='grid grid-cols-2 gap-2'>
						{images
							.slice(0, 2)
							.map((src, i) =>
								renderImage(
									src,
									i,
									`Recipe photo ${i + 1}`,
									'(max-width: 640px) 46vw, (max-width: 1024px) 25vw, 16vw',
									'aspect-square',
								),
							)}
					</div>
				</div>
				{fullscreenImage}
			</>
		)
	}

	return (
		<>
			<div className='w-full px-4 pt-3'>
				<div className='flex flex-col gap-2'>
					{renderImage(
						images[0],
						0,
						'Recipe photo 1',
						'(max-width: 640px) 92vw, (max-width: 1024px) 50vw, 33vw',
						'aspect-4/3 w-full',
					)}
					<div className='grid grid-cols-2 gap-2'>
						{images
							.slice(1, 3)
							.map((src, i) =>
								renderImage(
									src,
									i + 1,
									`Recipe photo ${i + 2}`,
									'(max-width: 640px) 46vw, (max-width: 1024px) 25vw, 16vw',
									'aspect-square',
								),
							)}
					</div>
				</div>
			</div>
			{fullscreenImage}
		</>
	)
}

/** Image with a centered spinner that disappears once loaded. */
function GalleryImage({
	src,
	alt,
	sizes,
	cookiesReady,
	className,
	isTapped,
	onTap,
	onFullscreen,
}: {
	src: string
	alt: string
	sizes: string
	cookiesReady: boolean
	className?: string
	isTapped: boolean
	onTap: () => void
	onFullscreen: () => void
}) {
	const [loaded, setLoaded] = useState(false)

	useEffect(() => {
		setLoaded(false)
	}, [src, cookiesReady])

	return (
		<div
			className={cn(
				'group relative cursor-pointer overflow-hidden rounded-xl bg-forest-150',
				!cookiesReady && 'cursor-wait',
				className,
			)}
			onClick={onTap}>
			{(!loaded || !cookiesReady) && (
				<div className='absolute inset-0 flex items-center justify-center'>
					<LoaderIcon size={32} className='animate-spin text-forest-200' />
				</div>
			)}
			{cookiesReady && (
				<Image
					src={src}
					alt={alt}
					fill
					sizes={sizes}
					loader={proxyLoader}
					className='object-cover'
					onLoad={() => setLoaded(true)}
				/>
			)}
			{cookiesReady && (
				<>
					<div
						className={cn(
							'pointer-events-none absolute inset-0 rounded-xl bg-forest-400 opacity-0 transition-opacity duration-300 group-hover:opacity-20',
							isTapped && 'opacity-20',
						)}
					/>
					<div
						className={cn(
							'pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100',
							isTapped && 'pointer-events-auto opacity-100',
						)}>
						<button
							type='button'
							aria-label={`Fullscreen ${alt.toLowerCase()}`}
							className='cursor-pointer rounded-lg bg-forest-50 p-2 text-forest-400 shadow-center-sm transition-all duration-200'
							onClick={(event) => {
								event.stopPropagation()
								onFullscreen()
							}}>
							<Maximize size={18} />
						</button>
					</div>
				</>
			)}
		</div>
	)
}

function RecipeImageFullscreen({
	image,
	imageIndex,
	onClose,
}: {
	image: string
	imageIndex: number
	onClose: () => void
}) {
	const [isTapped, setIsTapped] = useState(false)
	const [loaded, setLoaded] = useState(false)

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose()
		}

		document.addEventListener('keydown', onKeyDown)
		return () => document.removeEventListener('keydown', onKeyDown)
	}, [onClose])

	return (
		<div
			role='dialog'
			aria-label='Recipe photo viewer'
			className='fixed inset-0 z-60 max-h-screen max-w-screen bg-neutral-950 backdrop-blur-xs'
			onClick={() => setIsTapped(!isTapped)}>
			<div
				className={cn(
					'absolute inset-0 transition-all duration-500 ease-out',
					loaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
				)}>
				<Image
					src={image}
					alt={`Recipe photo ${imageIndex + 1}`}
					fill
					sizes='100vw'
					loader={proxyLoader}
					className='object-contain'
					priority
					onLoad={() => setLoaded(true)}
				/>
			</div>
			<div
				className={cn(
					'pointer-events-none absolute right-8 top-8 flex flex-col gap-2 opacity-0 transition-opacity duration-300',
					isTapped && 'pointer-events-auto opacity-100',
				)}
				onClick={onClose}>
				<button
					type='button'
					aria-label='Minimize recipe photo'
					className='cursor-pointer rounded-lg bg-forest-50 p-2 text-forest-400 shadow-center-sm transition-all duration-200'
					onClick={onClose}>
					<Minimize size={24} />
				</button>
			</div>
		</div>
	)
}

/**
 * Empty-state placeholder shown when a recipe has no images.
 */
export function RecipeGalleryPlaceholder({ text }: { text: string }) {
	return (
		<div className='w-full p-3'>
			<div className='flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-forest-200/25 bg-forest-150 px-3 py-6'>
				<ImageIcon size={24} className='text-forest-200' />
				<span className='text-center text-xs text-forest-200'>{text}</span>
			</div>
		</div>
	)
}
