import type { ClipboardEvent, KeyboardEvent } from 'react'

const digitOnlyPattern = /^\d+$/

export function parseOptionalIntegerInput(value: unknown): number | undefined {
	const digits = String(value ?? '').replace(/\D/g, '')
	return digits ? Number.parseInt(digits, 10) : undefined
}

export function preventNonDigitKey(event: KeyboardEvent<HTMLInputElement>) {
	if (event.metaKey || event.ctrlKey || event.altKey) return
	if (event.key.length === 1 && !digitOnlyPattern.test(event.key)) {
		event.preventDefault()
	}
}

export function preventNonDigitPaste(event: ClipboardEvent<HTMLInputElement>) {
	if (!digitOnlyPattern.test(event.clipboardData.getData('text'))) {
		event.preventDefault()
	}
}
