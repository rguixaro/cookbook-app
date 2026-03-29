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
		<div className='flex my-5 w-full flex-col border-4 bg-forest-50 border-forest-150 p-4 rounded-3xl text-forest-400'>
			<div className='mb-10 flex flex-col space-y-3'>
				<div className='flex items-center justify-between space-x-2'>
					<TypographyH4 className='my-0 text-forest-300'>
						{props.title}
					</TypographyH4>
					{props.action}
				</div>
				<p className='text-sm opacity-70'>{props.description}</p>
			</div>
			{props.children}
		</div>
	)
}
