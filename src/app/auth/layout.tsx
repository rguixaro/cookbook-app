import type { ReactNode } from 'react';

import { cn } from '@/utils';

interface AuthLayoutProps {
	children: ReactNode;
}

export default function AuthLayout(props: AuthLayoutProps) {
	return (
		<>
			<main
				className={cn(
					'mt-20 flex w-full flex-col items-center justify-center space-y-8'
				)}>
				<div className='flex flex-col items-center justify-center'>
					{props.children}
				</div>
			</main>
		</>
	);
}
