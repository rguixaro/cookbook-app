import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/utils'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const now = new Date()

	return [
		{
			url: new URL('/', SITE_URL).toString(),
			lastModified: now,
		},
	]
}
