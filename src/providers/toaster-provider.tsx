'use client'

import { Toaster } from 'sonner'

/**
 * Toaster Provider component.
 * @returns JSX.Element
 */
export const ToasterProvider = () => {
	return (
		<Toaster
			position='bottom-center'
			theme={'light'}
			toastOptions={{
				classNames: {
					toast: 'font-sans! font-bold! border-0! rounded-2xl! bg-forest-200! text-forest-50! shadow-center-sm!',
				},
			}}
		/>
	)
}
