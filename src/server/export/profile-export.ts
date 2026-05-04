import { db } from '@/server/db'
import { getRecipeImageFromS3 } from '@/lib/s3'
import { createZipStream, type ZipEntry } from '@/lib/zip'
import {
	normalizeRecipeComplements,
	normalizeRecipeCourseAndCategories,
} from '@/server/schemas'

type ExportUser = {
	id: string
	createdAt?: Date
	updatedAt?: Date
	image: string | null
	name: string | null
	username: string
	email?: string
	isPrivate?: boolean
	savedRecipes?: string[]
	favouriteRecipes?: string[]
}

type ExportRecipe = {
	id: string
	slug: string
	name: string
	time: number | null
	instructions: string
	ingredients: string[]
	complements?: unknown
	images: string[]
	sourceUrls: string[]
	createdAt: Date
	updatedAt: Date
	course: string
	categories?: string[]
	authorId: string
	author: ExportUser | null
}

type ExportContext = {
	user: Required<Pick<ExportUser, 'id' | 'username' | 'email'>> &
		Omit<ExportUser, 'id' | 'username' | 'email'>
	recipes: ExportRecipe[]
	ids: ExportIds
}

type ExportIds = {
	users: Map<string, string>
	recipes: Map<string, string>
	images: Map<string, string>
	imageFiles: Map<string, string>
}

export type ProfileJsonExportResult =
	| { error: false; filename: string; payload: unknown }
	| { error: true; status: number; message: string }

export type ProfileImagesExportResult =
	| { error: false; filename: string; stream: ReadableStream<Uint8Array> }
	| { error: true; status: number; message: string }

const toExportId = (prefix: string, index: number) =>
	`${prefix}_${String(index + 1).padStart(4, '0')}`

function createIdMap<T>(
	items: T[],
	prefix: string,
	getId: (item: T) => string,
) {
	return new Map(
		items.map((item, index) => [getId(item), toExportId(prefix, index)]),
	)
}

function mapRequired(map: Map<string, string>, value: string) {
	const mapped = map.get(value)
	if (!mapped) throw new Error('error-export-id-map-missing')
	return mapped
}

function mapOptional(map: Map<string, string>, value?: string | null) {
	return value ? mapRequired(map, value) : null
}

export function safeExportFilename(
	value: string,
	fallback = 'cookbook-profile',
) {
	const safe = value
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-zA-Z0-9._-]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.toLowerCase()

	return safe || fallback
}

export function exportTimestamp(date = new Date()) {
	return date
		.toISOString()
		.replace(/\.\d{3}Z$/, '')
		.replace(/[-:]/g, '')
		.replace('T', '-')
}

function getImageExtension(fileKey: string) {
	const ext = fileKey
		.split('/')
		.pop()
		?.match(/\.([a-zA-Z0-9]+)$/)?.[1]
	return ext ? `.${ext.toLowerCase()}` : '.jpg'
}

function toImageFileName(fileKey: string, index: number, imageId: string) {
	return `photos/${String(index + 1).padStart(4, '0')}-${imageId}${getImageExtension(fileKey)}`
}

function publicAuthor(author: ExportUser | null, ids: ExportIds) {
	if (!author) return null

	return {
		id: mapRequired(ids.users, author.id),
		username: author.username,
		name: author.name,
		image: author.image,
	}
}

function createExportIds(user: ExportUser, recipes: ExportRecipe[]): ExportIds {
	const usersById = new Map<string, ExportUser>([[user.id, user]])

	for (const recipe of recipes) {
		if (recipe.author) usersById.set(recipe.author.id, recipe.author)
	}

	const imageKeys = Array.from(
		new Set(recipes.flatMap((recipe) => recipe.images)),
	)
	const imageIds = new Map(
		imageKeys.map((fileKey, index) => [fileKey, toExportId('image', index)]),
	)
	const imageFiles = new Map(
		imageKeys.map((fileKey, index) => [
			fileKey,
			toImageFileName(fileKey, index, mapRequired(imageIds, fileKey)),
		]),
	)

	return {
		users: createIdMap(
			Array.from(usersById.values()),
			'user',
			(entry) => entry.id,
		),
		recipes: createIdMap(recipes, 'recipe', (recipe) => recipe.id),
		images: imageIds,
		imageFiles,
	}
}

function mergeRecipes(authored: ExportRecipe[], related: ExportRecipe[]) {
	const recipesById = new Map<string, ExportRecipe>()

	for (const recipe of [...authored, ...related]) {
		if (!recipesById.has(recipe.id)) recipesById.set(recipe.id, recipe)
	}

	return Array.from(recipesById.values()).sort((a, b) => {
		const byDate = a.createdAt.getTime() - b.createdAt.getTime()
		return byDate || a.id.localeCompare(b.id)
	})
}

async function collectProfileExportContext(userId: string) {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			createdAt: true,
			updatedAt: true,
			image: true,
			name: true,
			username: true,
			email: true,
			isPrivate: true,
			savedRecipes: true,
			favouriteRecipes: true,
		},
	})

	if (!user) return null

	const recipeInclude = {
		author: {
			select: {
				id: true,
				username: true,
				name: true,
				image: true,
				isPrivate: true,
			},
		},
	} as const

	const relatedIds = Array.from(
		new Set([...user.savedRecipes, ...user.favouriteRecipes]),
	)

	const [authored, related] = await Promise.all([
		db.recipe.findMany({
			where: { authorId: user.id },
			include: recipeInclude,
			orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
		}),
		relatedIds.length
			? db.recipe.findMany({
					where: {
						id: { in: relatedIds },
						authorId: { not: user.id },
						author: { isPrivate: false },
					},
					include: recipeInclude,
					orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
				})
			: Promise.resolve([]),
	])

	const recipes = mergeRecipes(
		authored as ExportRecipe[],
		related as ExportRecipe[],
	)
	const ids = createExportIds(user, recipes)

	return { user, recipes, ids } satisfies ExportContext
}

export function buildProfileJsonPayload(context: ExportContext) {
	const { user, recipes, ids } = context
	const savedRecipes = user.savedRecipes ?? []
	const favouriteRecipes = user.favouriteRecipes ?? []
	const savedSet = new Set(savedRecipes)
	const favouriteSet = new Set(favouriteRecipes)
	const includedRecipeIds = new Set(recipes.map((recipe) => recipe.id))
	const mapRecipeList = (list: string[]) =>
		list
			.filter((recipeId) => includedRecipeIds.has(recipeId))
			.map((recipeId) => mapRequired(ids.recipes, recipeId))

	return {
		schemaVersion: 4,
		generatedAt: new Date().toISOString(),
		generatedBy: mapRequired(ids.users, user.id),
		profile: {
			id: mapRequired(ids.users, user.id),
			username: user.username,
			name: user.name,
			email: user.email,
			image: user.image,
			isPrivate: user.isPrivate,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		},
		recipes: recipes.map((recipe) => {
			const normalized = normalizeRecipeCourseAndCategories(
				recipe.course,
				recipe.categories,
			)

			return {
				id: mapRequired(ids.recipes, recipe.id),
				slug: recipe.slug,
				name: recipe.name,
				time: recipe.time,
				instructions: recipe.instructions,
				ingredients: recipe.ingredients,
				complements: normalizeRecipeComplements(recipe.complements),
				course: normalized.course,
				categories: normalized.categories,
				authorId: mapRequired(ids.users, recipe.authorId),
				author: publicAuthor(recipe.author, ids),
				images: recipe.images.map((image) =>
					mapRequired(ids.imageFiles, image),
				),
				sourceUrls: recipe.sourceUrls,
				createdAt: recipe.createdAt,
				updatedAt: recipe.updatedAt,
				relations: {
					authored: recipe.authorId === user.id,
					saved: savedSet.has(recipe.id),
					favourited: favouriteSet.has(recipe.id),
				},
			}
		}),
		lists: {
			authored: recipes
				.filter((recipe) => recipe.authorId === user.id)
				.map((recipe) => mapRequired(ids.recipes, recipe.id)),
			saved: mapRecipeList(savedRecipes),
			favourites: mapRecipeList(favouriteRecipes),
		},
		counts: {
			recipes: recipes.length,
			authored: recipes.filter((recipe) => recipe.authorId === user.id).length,
			saved: mapRecipeList(savedRecipes).length,
			favourites: mapRecipeList(favouriteRecipes).length,
			images: ids.imageFiles.size,
		},
	}
}

function toAsyncIterable(body: unknown): AsyncIterable<Uint8Array> {
	if (body && typeof body === 'object' && Symbol.asyncIterator in body) {
		return body as AsyncIterable<Uint8Array>
	}

	throw new Error('error-image-download')
}

function buildImageManifest(context: ExportContext) {
	const payload = buildProfileJsonPayload(context) as {
		schemaVersion: number
		generatedAt: string
		generatedBy: string
		profile: unknown
		recipes: unknown[]
		counts: { images: number }
	}

	return {
		schemaVersion: payload.schemaVersion,
		generatedAt: payload.generatedAt,
		generatedBy: payload.generatedBy,
		profile: payload.profile,
		recipes: payload.recipes,
		counts: {
			recipes: payload.recipes.length,
			images: payload.counts.images,
		},
	}
}

function buildImageEntries(context: ExportContext): ZipEntry[] {
	const generatedAt = new Date()
	const manifest = buildImageManifest(context)

	return [
		{
			name: 'manifest.json',
			source: `${JSON.stringify(manifest, null, 2)}\n`,
			modifiedAt: generatedAt,
		},
		...Array.from(context.ids.imageFiles.entries()).map(
			([fileKey, filename]) => ({
				name: filename,
				modifiedAt: generatedAt,
				source: async () => {
					const object = await getRecipeImageFromS3(fileKey)
					return toAsyncIterable(object.Body)
				},
			}),
		),
	]
}

export async function collectProfileJsonExport(
	userId: string,
): Promise<ProfileJsonExportResult> {
	const context = await collectProfileExportContext(userId)
	if (!context)
		return { error: true, status: 404, message: 'error-profile-not-found' }

	return {
		error: false,
		filename: `${safeExportFilename(context.user.username)}-cookbook-export-${exportTimestamp()}.json`,
		payload: buildProfileJsonPayload(context),
	}
}

export async function collectProfileImagesExport(
	userId: string,
): Promise<ProfileImagesExportResult> {
	const context = await collectProfileExportContext(userId)
	if (!context)
		return { error: true, status: 404, message: 'error-profile-not-found' }

	return {
		error: false,
		filename: `${safeExportFilename(context.user.username)}-recipe-images-${exportTimestamp()}.zip`,
		stream: createZipStream(buildImageEntries(context)),
	}
}
