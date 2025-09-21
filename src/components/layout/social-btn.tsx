'use client'

import { ChefHat } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/utils'

type SocialButtonProps = React.HTMLAttributes<HTMLAnchorElement> & {
	className?: string
}

export function SocialButton({ className }: SocialButtonProps) {
	return (
		<Link
			href='/authors'
			className={cn(
				'w-8 h-8 ms-2 rounded hover:bg-forest-200/15 z-10 flex items-center justify-center ',
				className
			)}>
			<ChefHat className='w-full h-full p-1 text-forest-200' />
		</Link>
	)
}
