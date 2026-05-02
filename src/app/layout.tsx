import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { SessionProvider } from 'next-auth/react'

import { auth } from '@/auth'
import { ToasterProvider, ProfileProvider, CookiesProvider } from '@/providers'
import { Header } from '@/components/layout/header'
import '@/styles/globals.css'
import { cn } from '@/utils'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: 'CookBook',
	description: 'CookBook',
	openGraph: {
		title: 'CookBook',
		description: 'CookBook',
		siteName: 'CookBook',
		images: [
			{
				url: '/images/favicon.png',
				width: 2731,
				height: 2731,
				alt: 'CookBook',
			},
		],
	},
	twitter: {
		card: 'summary',
		title: 'CookBook',
		description: 'CookBook',
		images: ['/images/favicon.png'],
	},
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const locale = await getLocale()
	const messages = await getMessages()

	const session = await auth()
	const userName = session?.user.name

	return (
		<html lang={locale} suppressHydrationWarning>
			<head>
				<meta name='version' content={process.env.NEXT_PUBLIC_APP_VERSION} />
				<link rel='icon' type='image/svg+xml' href='/images/favicon.svg' />
				<link rel='alternate icon' href='/images/favicon.png' />
			</head>
			<body
				className={cn(
					'font-sans antialiased bg-forest-50 selection:bg-forest-150',
					'flex flex-col items-center',
				)}>
				<SessionProvider session={session}>
					<NextIntlClientProvider messages={messages}>
						<ProfileProvider initialName={userName || ''}>
							<CookiesProvider>
								<Header />
								<div className='mt-4 h-full w-full'>{children}</div>
								<ToasterProvider />
							</CookiesProvider>
						</ProfileProvider>
					</NextIntlClientProvider>
				</SessionProvider>
			</body>
		</html>
	)
}
