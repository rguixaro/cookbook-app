import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '@/styles/globals.css';

import { AuthStoreProvider } from '@/providers/auth-store-provider';
import { RecipesStoreProvider } from '@/providers/recipes-store-provider';
import { ToasterComponent } from '@/providers/toaster';
import Header from '@/components/layout/header';
import { cn } from '@/utils';

const cochin = localFont({
	variable: '--font-cochin',
	src: '../fonts/cochin.otf',
	weight: '100 900',
	display: 'swap',
	preload: true,
});

const montserrat = localFont({
	variable: '--font-montserrat',
	src: [
		{ path: '../fonts/montserrat-regular.ttf', weight: '400' },
		{ path: '../fonts/montserrat-medium.ttf', weight: '500' },
		{ path: '../fonts/montserrat-semibold.ttf', weight: '600' },
		{ path: '../fonts/montserrat-bold.ttf', weight: '700' },
		{ path: '../fonts/montserrat-extrabold.ttf', weight: '800' },
	],
});

const guavine = localFont({
	variable: '--font-guavine',
	src: '../fonts/guavine-regular.otf',
	weight: '400',
	display: 'swap',
	preload: true,
});

export const metadata: Metadata = {
	title: 'Recipes',
	description: 'Recipes App',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en' suppressHydrationWarning>
			<body
				className={cn(
					`font-sans ${cochin.variable} ${montserrat.variable} ${guavine.variable} antialiased`,
					'bg-[#fefff2] selection:bg-forest-200/15 flex justify-center'
				)}>
				<div className='w-10/12 sm:w-2/4 lg:w-2/6'>
					<AuthStoreProvider>
						<RecipesStoreProvider>
							<Header />
							{children}
							<ToasterComponent />
						</RecipesStoreProvider>
					</AuthStoreProvider>
				</div>
			</body>
		</html>
	);
}
