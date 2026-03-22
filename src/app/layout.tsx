import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { SessionProvider } from 'next-auth/react'

import { auth } from '@/auth'
import { ToasterProvider, ProfileProvider } from '@/providers'
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
					'font-sans antialiased bg-[#fefff2] selection:bg-forest-200/15',
					'flex flex-col items-center',
				)}>
				<SessionProvider>
					<NextIntlClientProvider messages={messages}>
						<ProfileProvider initialName={userName || ''}>
							<Header />
							{children}
							<ToasterProvider />
						</ProfileProvider>
					</NextIntlClientProvider>
				</SessionProvider>
			</body>
		</html>
	)
}
