import { DeleteObjectsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'

import { env } from '@/env.mjs'

const { AMAZON_REGION, AMAZON_S3_BUCKET_NAME } = env

const s3 = new S3Client({ region: AMAZON_REGION })

/**
 * Upload a recipe image to S3.
 * Compresses to JPEG (max 2048×2048, quality 85%).
 * @returns The S3 file key (without the bucket prefix)
 */
export async function uploadRecipeImage(
	file: File,
	recipeId: string,
): Promise<string> {
	const MAX_SIZE = 10 * 1024 * 1024
	if (file.size > MAX_SIZE) throw new Error('File too large (max 10 MB)')

	const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
	if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Unsupported image type')

	const arrayBuffer = await file.arrayBuffer()
	const buffer = new Uint8Array(arrayBuffer)

	const metadata = await sharp(buffer).metadata()
	const ALLOWED_FORMATS = ['jpeg', 'png', 'webp', 'gif']
	if (!metadata.format || !ALLOWED_FORMATS.includes(metadata.format)) {
		throw new Error('File is not a valid image')
	}

	const compressedBuffer = await sharp(buffer)
		.resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
		.jpeg({ quality: 85 })
		.toBuffer()

	const fileKey = `images/recipe_${recipeId}/${crypto.randomUUID()}.jpg`

	await s3.send(
		new PutObjectCommand({
			Bucket: AMAZON_S3_BUCKET_NAME,
			Key: `cookbook/${fileKey}`,
			Body: compressedBuffer,
			ContentType: 'image/jpeg',
		}),
	)

	return fileKey
}

/**
 * Delete recipe images from S3.
 */
export async function deleteRecipeImages(fileKeys: string[]): Promise<void> {
	if (!fileKeys.length) return

	await s3.send(
		new DeleteObjectsCommand({
			Bucket: AMAZON_S3_BUCKET_NAME,
			Delete: { Objects: fileKeys.map((key) => ({ Key: `cookbook/${key}` })) },
		}),
	)
}
