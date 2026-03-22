'use client'

import { useRef, useState, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

import { useDebounce } from '@/hooks'
import { cn } from '@/utils'
import { useTranslations } from 'next-intl'

export const SearchProfiles = () => {
	const t = useTranslations('ProfilesPage')

	const searchParams = useSearchParams()
	const pathname = usePathname()
	const router = useRouter()

	const inputRef = useRef<HTMLInputElement>(null)
	const [value, setValue] = useState('')

	// Debounce the search value
	const debouncedValue = useDebounce(value, 200)

	// Initialize input from URL on mount
	useEffect(() => {
		const initialValue = searchParams.get('search') || ''
		setValue(initialValue)
	}, [searchParams])

	// Update URL when debounced value changes
	useEffect(() => {
		// Skip if value didn't change
		const currentSearch = searchParams.get('search') || ''
		if (debouncedValue === currentSearch) return

		const params = new URLSearchParams(searchParams)

		if (debouncedValue.length >= 2) {
			params.set('search', debouncedValue)
		} else {
			params.delete('search')
		}

		router.replace(`${pathname}?${params.toString()}`)
	}, [debouncedValue, pathname, router, searchParams])

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(e.target.value)
	}

	const clearInput = () => {
		setValue('')
		inputRef.current?.focus()
	}

	return (
		<div className='flex justify-center my-4'>
			<div className='relative w-full'>
				<Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-200' />
				<input
					ref={inputRef}
					type='text'
					placeholder={t('search')}
					value={value}
					onChange={onChange}
					id='profile-search-input'
					className={cn(
						'w-full h-8 text-sm pl-9 pr-9 rounded-xl',
						'bg-forest-200/15 border-l-[5px] border-forest-200 ring-2 ring-forest-200',
						'text-forest-200 font-medium placeholder-forest-200/75 focus:outline-none',
					)}
				/>
				<button
					type='button'
					onClick={clearInput}
					className={cn(
						'absolute right-3 top-1/2 -translate-y-1/2 text-forest-300 transition-all duration-200 ease-in-out',
						value
							? 'opacity-100 translate-x-0'
							: 'opacity-0 translate-x-2 pointer-events-none',
					)}>
					<X className='w-4 h-4' />
				</button>
			</div>
		</div>
	)
}
