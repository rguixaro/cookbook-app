import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { SessionProvider } from 'next-auth/react';

import { ToasterProvider } from '@/providers';
import { Header } from '@/components/layout/header';
import '@/styles/globals.css';
import { cn } from '@/utils';

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
	title: 'Cookbook',
	description: 'Cookbook App',
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<html lang={locale} suppressHydrationWarning>
			<body
				className={cn(
					`font-sans ${montserrat.variable} ${guavine.variable} antialiased`,
					'bg-[#fefff2] selection:bg-forest-200/15 flex justify-center'
				)}>
				<div className='w-10/12 sm:w-2/4 lg:w-2/6'>
					<SessionProvider>
						<NextIntlClientProvider messages={messages}>
							<Header />
							{children}
							<ToasterProvider />
						</NextIntlClientProvider>
					</SessionProvider>
				</div>
			</body>
		</html>
	);
}
