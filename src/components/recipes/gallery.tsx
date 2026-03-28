'use client'

import { useState } from 'react'
import Image, { ImageLoader } from 'next/image'
import { ImageIcon } from 'lucide-react'

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
	if (!images.length) return null

	const count = Math.min(images.length, 3)

	if (count === 1) {
		return (
			<div className='w-full px-4 pt-3'>
				<div className='relative aspect-4/3 w-full overflow-hidden rounded-xl bg-forest-200/15'>
					<Image
						src={images[0]}
						alt='Recipe photo'
						fill
						loader={proxyLoader}
						className='object-cover'
					/>
				</div>
			</div>
		)
	}

	if (count === 2) {
		return (
			<div className='w-full px-4 pt-3'>
				<div className='grid grid-cols-2 gap-2'>
					{images.slice(0, 2).map((src, i) => (
						<div
							key={i}
							className='relative aspect-square overflow-hidden rounded-xl bg-forest-200/15'>
							<Image
								src={src}
								alt={`Recipe photo ${i + 1}`}
								fill
								loader={proxyLoader}
								className='object-cover'
							/>
						</div>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className='w-full px-4 pt-3'>
			<div className='flex flex-col gap-2'>
				<div className='relative aspect-4/3 w-full overflow-hidden rounded-xl bg-forest-200/15'>
					<Image
						src={images[0]}
						alt='Recipe photo 1'
						fill
						loader={proxyLoader}
						className='object-cover'
					/>
				</div>
				<div className='grid grid-cols-2 gap-2'>
					{images.slice(1, 3).map((src, i) => (
						<div
							key={i}
							className='relative aspect-square overflow-hidden rounded-xl bg-forest-200/15'>
							<Image
								src={src}
								alt={`Recipe photo ${i + 2}`}
								fill
								loader={proxyLoader}
								className='object-cover'
							/>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

/**
 * Empty-state placeholder shown when a recipe has no images.
 */
export function RecipeGalleryPlaceholder() {
	return (
		<div className='w-full px-4 pt-3'>
			<div className='flex items-center justify-center aspect-3/1 w-full rounded-xl bg-forest-200/10 border-2 border-dashed border-forest-200/25'>
				<ImageIcon size={24} className='text-forest-200/40' />
			</div>
		</div>
	)
}

/**
 * Small thumbnail for recipe list item cards.
 * Shows the first image or a placeholder icon.
 */
export function RecipeThumbnail({ src }: { src?: string }) {
	if (!src) return null

	return (
		<div className='w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-forest-200/15'>
			<Image
				src={src}
				alt='Recipe thumbnail'
				width={48}
				height={48}
				loader={proxyLoader}
				className='object-cover w-full h-full'
			/>
		</div>
	)
}
