import type { ReactNode } from 'react'

import { cn } from '@/utils'

interface AuthLayoutProps {
	children: ReactNode
}

export default function AuthLayout(props: AuthLayoutProps) {
	return (
		<main
			className={cn(
				'flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden px-4 py-8',
			)}>
			{props.children}
		</main>
	)
}
