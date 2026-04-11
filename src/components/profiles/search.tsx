'use client'

import { useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { useTranslations } from 'next-intl'

import { SearchInput } from '@/ui'

export const SearchProfiles = () => {
	const t = useTranslations('ProfilesPage')

	const searchParams = useSearchParams()
	const pathname = usePathname()
	const router = useRouter()

	const inputRef = useRef<HTMLInputElement>(null)

	const [inputValue, setInputValue] = useState(
		searchParams.get('search')?.toString() || '',
	)

	const handleSearch = useDebouncedCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const params = new URLSearchParams(searchParams)
			if (e.target.value) params.set('search', e.target.value)
			else params.delete('search')

			router.replace(`${pathname}?${params.toString()}`)
		},
		300,
	)

	return (
		<div className='w-11/12 sm:w-3/5 lg:w-3/8 flex flex-col my-4'>
			<SearchInput
				placeholder={t('search')}
				value={inputValue}
				inputRef={inputRef}
				onChange={(e) => {
					setInputValue(e.target.value)
					handleSearch(e)
				}}
				onClear={() => {
					setInputValue('')
					if (inputRef.current) {
						inputRef.current.value = ''
						handleSearch({
							target: inputRef.current,
						} as React.ChangeEvent<HTMLInputElement>)
					}
				}}
				inputClassName='w-full'
				searchButtonClassName='translate-x-1 bg-forest-150 border-l-4 border-forest-200'
				searchIconClassName='text-forest-300'
			/>
		</div>
	)
}
