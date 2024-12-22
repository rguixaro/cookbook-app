'use client';

import { Toaster } from 'sonner';

/**
 * Toaster Provider component.
 * @returns JSX.Element
 */
export const ToasterProvider = () => {
	return (
		<Toaster
			position='bottom-right'
			theme={'light'}
			toastOptions={{
				classNames: {
					toast: 'font-sans font-bold bg-forest-200 border-forest-200/15 text-white',
				},
			}}
		/>
	);
};
