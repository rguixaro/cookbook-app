import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names
 * @param inputs
 * @returns A string of class names
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
