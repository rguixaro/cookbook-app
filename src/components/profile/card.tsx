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
		<div className='flex my-5 w-full flex-col border-8 bg-forest-100 border-forest-150 p-4 rounded-3xl text-forest-400'>
			<div className='flex flex-col space-y-3'>
				<div className='flex items-center justify-between space-x-2'>
					<TypographyH4 className='my-0 text-forest-300'>
						{props.title}
					</TypographyH4>
					{props.action}
				</div>
				<p className='text-sm'>{props.description}</p>
			</div>
			<div className='w-full justify-center flex my-8'>
				<div className='h-2 w-3/4 rounded bg-forest-150' />
			</div>
			{props.children}
		</div>
	)
}
