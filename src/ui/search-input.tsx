'use client'

import { X } from 'lucide-react'

import { SearchButton } from '@/components/layout'
import { cn } from '@/utils'

type SearchInputProps = {
	placeholder: string
	value: string
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
	onClear: () => void
	inputRef?: React.RefObject<HTMLInputElement | null>
	onBlur?: () => void
	onSearchButtonClick?: () => void
	inputClassName?: string
	searchButtonClassName?: string
	searchIconClassName?: string
	wrapperClassName?: string
}

export function SearchInput({
	placeholder,
	value,
	onChange,
	onClear,
	inputRef,
	onBlur,
	onSearchButtonClick,
	inputClassName,
	searchButtonClassName,
	searchIconClassName,
	wrapperClassName,
}: SearchInputProps) {
	return (
		<div className={cn('h-8 flex relative', wrapperClassName)}>
			<input
				type='text'
				ref={inputRef}
				maxLength={50}
				placeholder={placeholder}
				onBlur={onBlur}
				value={value}
				onChange={onChange}
				className={cn(
					'relative block h-8 text-sm z-10 bg-forest-100 text-forest-200 font-medium placeholder-forest-200/75',
					'transition-all duration-500 rounded-xl focus:outline-none ring-4 ring-forest-100 ps-12 pe-3',
					inputClassName,
				)}
				required
			/>
			<SearchButton
				onClick={onSearchButtonClick}
				className={cn(
					'absolute top-1/2 -translate-y-1/2 transition-transform',
					searchButtonClassName,
				)}
				iconClassName={searchIconClassName}
			/>
			<button
				type='button'
				onClick={onClear}
				className={cn(
					'absolute top-1/2 right-0 -translate-y-1/2 z-30 text-forest-300 transition-all duration-200 ease-in-out',
					value
						? 'opacity-100 -translate-x-2'
						: 'opacity-0 translate-x-2 pointer-events-none',
				)}>
				<X className='w-4 h-4' />
			</button>
		</div>
	)
}
