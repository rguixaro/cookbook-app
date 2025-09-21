'use client'

import { User } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/utils'

type UserButtonProps = React.HTMLAttributes<HTMLAnchorElement> & {
	className?: string
}

export function UserButton({ className }: UserButtonProps) {
	return (
		<Link
			href='/profile'
			className={cn(
				'w-8 h-8 ms-2 rounded hover:bg-forest-200/15 z-10 flex items-center justify-center ',
				className
			)}>
			<User className='w-full h-full p-1 text-forest-200' />
		</Link>
	)
}
