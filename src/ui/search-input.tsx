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
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
	onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
	onSearchButtonClick?: () => void
	inputClassName?: string
	searchButtonClassName?: string
	searchIconClassName?: string
	clearButtonClassName?: string
	wrapperClassName?: string
}

export function SearchInput({
	placeholder,
	value,
	onChange,
	onClear,
	inputRef,
	onBlur,
	onKeyDown,
	onSearchButtonClick,
	inputClassName,
	searchButtonClassName,
	searchIconClassName,
	clearButtonClassName,
	wrapperClassName,
}: SearchInputProps) {
	return (
		<div
			className={cn(
				'relative flex h-10 min-w-14 overflow-hidden rounded-xl bg-forest-100 px-3 py-1',
				wrapperClassName,
			)}
		>
			<input
				type='search'
				autoComplete='off'
				enterKeyHint='search'
				inputMode='search'
				name='search'
				ref={inputRef}
				maxLength={50}
				placeholder={placeholder}
				onBlur={onBlur}
				onKeyDown={onKeyDown}
				value={value}
				onChange={onChange}
				className={cn(
					'relative z-10 block h-8 min-w-0 rounded-xl bg-transparent text-sm font-medium text-forest-200 placeholder-forest-200/75',
					'ps-10 pe-8 transition-all duration-500 focus:outline-none',
					inputClassName,
				)}
			/>
			<SearchButton
				aria-label={placeholder}
				onClick={onSearchButtonClick}
				onPointerDown={(e) => e.preventDefault()}
				className={cn(
					'absolute left-3 top-1/2 -translate-y-1/2',
					searchButtonClassName,
				)}
				iconClassName={searchIconClassName}
			/>
			<button
				type='button'
				onPointerDown={(e) => e.preventDefault()}
				onClick={onClear}
				className={cn(
					'absolute top-1/2 right-3 -translate-y-1/2 z-30 text-forest-300 transition-all duration-200 ease-in-out',
					value
						? 'opacity-100 -translate-x-1'
						: 'opacity-0 translate-x-2 pointer-events-none',
					clearButtonClassName,
				)}
			>
				<X className='w-4 h-4' />
			</button>
		</div>
	)
}
