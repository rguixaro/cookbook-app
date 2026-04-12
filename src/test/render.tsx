import { render, type RenderOptions } from '@testing-library/react'
import { type ReactElement } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { ProfileProvider } from '@/providers/profile-provider'
import messages from '../../messages/en.json'

function MockCookiesProvider({ children }: { children: React.ReactNode }) {
	return <>{children}</>
}

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & {
	profileName?: string
}

function AllProviders({
	children,
	profileName,
}: {
	children: React.ReactNode
	profileName?: string
}) {
	return (
		<NextIntlClientProvider messages={messages} locale='en'>
			<ProfileProvider initialName={profileName ?? 'Test User'}>
				<MockCookiesProvider>{children}</MockCookiesProvider>
			</ProfileProvider>
		</NextIntlClientProvider>
	)
}

export function renderWithProviders(
	ui: ReactElement,
	options: CustomRenderOptions = {},
) {
	const { profileName, ...renderOptions } = options
	return render(ui, {
		wrapper: ({ children }) => (
			<AllProviders profileName={profileName}>{children}</AllProviders>
		),
		...renderOptions,
	})
}

export { default as userEvent } from '@testing-library/user-event'
export * from '@testing-library/react'
