export function formatIngredientLabel(raw: string) {
	const value = raw.trim()
	if (!value) return raw

	return value.charAt(0).toLocaleUpperCase() + value.slice(1)
}
