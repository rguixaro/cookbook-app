import type { ReactNode } from 'react'

import { TypographyH4 } from '@/ui'

interface ProfileCardProps {
	title: string
	children: ReactNode
	description: string
	action: ReactNode
	className?: string
}

export const ProfileCard = (props: ProfileCardProps) => {
	return (
		<div className='flex w-full flex-col border-2 border-forest-200/15 p-4 rounded text-neutral-700'>
			<div className='mb-2 flex flex-col space-y-3 rounded'>
				<div className='flex items-center justify-between space-x-2'>
					<TypographyH4 className='my-0'>{props.title}</TypographyH4>
					{props.action}
				</div>
				<p className='text-sm opacity-70'>{props.description}</p>
			</div>
			{props.children}
		</div>
	)
}
