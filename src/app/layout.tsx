import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { SessionProvider } from 'next-auth/react'

import { auth } from '@/auth'
import { ToasterProvider, ProfileProvider, CookiesProvider } from '@/providers'
import { Header } from '@/components/layout/header'
import '@/styles/globals.css'
import { cn } from '@/utils'

export const metadata: Metadata = {
	title: 'CookBook',
	description: 'CookBook App',
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
								{children}
								<ToasterProvider />
							</CookiesProvider>
						</ProfileProvider>
					</NextIntlClientProvider>
				</SessionProvider>
			</body>
		</html>
	)
}
