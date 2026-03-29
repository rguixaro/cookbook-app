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
			href='/profiles'
			className={cn(
				'w-8 h-8 ms-2 rounded-xl hover:bg-forest-100 z-10 flex items-center justify-center ',
				className,
			)}>
			<ChefHat className='w-full h-full p-1 text-forest-200' />
		</Link>
	)
}
