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
		.trim();
}
