/**
 * Formats a long sentence by capitalizing the first letter of the first word and making the rest of the sentence lowercase.
 * @param sentence
 * @returns string
 */
export function formatLongSentence(sentence: string): string {
	return sentence
		.split('.')
		.map((s) =>
			s
				.trim()
				.replace(
					/^(\w)(.+)/,
					(match, p1, p2) => p1.toUpperCase() + p2.toLowerCase()
				)
		)
		.join('. ')
		.trim()
}

/**
 * Slugifies a string.
 * @param str string
 * @returns string
 */
export function slugify(str: string): string {
	return str
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '')
}
