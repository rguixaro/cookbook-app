'use client'

import { Search } from 'lucide-react'

import { cn } from '@/utils'

type SearchButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	className?: string
	iconClassName?: string
}

export function SearchButton({
	className,
	iconClassName,
	onClick,
}: SearchButtonProps) {
	return (
		<button
			onClick={onClick}
			className={cn(
				'w-8 h-8 rounded flex items-center justify-center z-40 hover:bg-forest-200/15 transition-all duration-300',
				className
			)}>
			<Search
				className={cn(
					'w-7 h-7 p-1 text-forest-200 transition-all duration-300',
					iconClassName
				)}
			/>
		</button>
	)
}
