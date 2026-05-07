'use client'

import { useEffect, useRef, useState } from 'react'
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

	const searchValue = searchParams.get('search')?.toString() || ''
	const [inputValue, setInputValue] = useState(searchValue)

	useEffect(() => {
		setInputValue(searchValue)
	}, [searchValue])

	const handleSearch = useDebouncedCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const params = new URLSearchParams(searchParams)
			if (e.target.value) params.set('search', e.target.value)
			else params.delete('search')

			const query = params.toString()
			router.replace(query ? `${pathname}?${query}` : pathname)
		},
		300,
	)

	return (
		<div className='w-11/12 sm:w-3/5 lg:w-3/8 flex justify-center my-5'>
			<SearchInput
				placeholder={t('search')}
				value={inputValue}
				inputRef={inputRef}
				onSearchButtonClick={() => inputRef.current?.focus()}
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
				wrapperClassName='h-12 w-72 max-w-[calc(100vw-3rem)] rounded-2xl bg-forest-100 px-5 py-2 sm:w-80 sm:max-w-80'
				inputClassName='h-8 w-full px-10 text-base opacity-100 pointer-events-auto'
				searchButtonClassName='left-5 bg-forest-100 hover:bg-forest-100'
				searchIconClassName='text-forest-300'
				clearButtonClassName='right-5'
			/>
		</div>
	)
}
